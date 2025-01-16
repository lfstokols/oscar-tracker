from typing import overload
from backend.data_management.api_schemas import api_CategoryCompletionsDict
from backend.logic.MyTypes import *
import requests
from bs4 import BeautifulSoup, Tag
import pandas as pd
from backend.logic.MyTypes import Grouping
import backend.logic.utils as utils
from backend.logic.StorageManager import StorageManager
from backend.logic.MyTypes import *


def are_movies_short(
    movies: pd.DataFrame, nominations: pd.DataFrame, categories: pd.DataFrame
) -> pd.Series:
    """
    Returns a boolean series indicating if each movie has any short nominations
    index: MovieID
    columns name: CategoryColumns.IS_SHORT
    """
    enriched_nominations = nominations.merge(
        categories, left_on=NomColumns.CATEGORY, right_index=True
    )
    num_short_noms = enriched_nominations.groupby(NomColumns.MOVIE)[
        CategoryColumns.IS_SHORT
    ].sum()
    return num_short_noms > 0


def are_movies_multinom(nominations: pd.DataFrame) -> pd.Series:
    return (nominations.groupby(NomColumns.MOVIE).size() > 1).rename(
        DerivedMovieColumns.IS_MULTI_NOM
    )

    # Create boolean series indicating if each movie has any short nominations
    is_short = pd.Series(False, index=movies.index, name="is_short")
    is_short[num_short_noms.index] = num_short_noms[CategoryColumns.IS_SHORT] > 0
    return is_short

    shorts: pd.Series = num_short_noms[num_short_noms >= 1]
    return categories.loc[categories[CategoryColumns.SHORT] == 1]
    # shortNominees: pd.Series = nominations[NomColumns.MOVIE].loc[
    #     nominations[NomColumns.CATEGORY].isin(shorts.index)
    # ]
    # movies["is_short"] = movies.index.isin(shortNominees.index)
    # return movies["is_short"]


# assumes there are 3 short categories, and that no short can  be nominated in non-short categories
def get_number_of_movies(storage: StorageManager, year, shortsIsOne=False) -> int:
    total = storage.read("movies", year).shape[0]
    categories = storage.read("categories")
    num_shorts = categories.loc[categories[CategoryColumns.IS_SHORT] == 1][
        CategoryColumns.MAX_NOMS
    ].sum()
    if shortsIsOne:
        return total - num_shorts + 3
    return total


def get_movies(storage: StorageManager, year, idList=None, json=False):
    data = storage.read("movies", year)
    noms = storage.read("nominations", year)
    categories = storage.read("categories")
    data[DerivedMovieColumns.NUM_NOMS] = (
        noms.groupby(NomColumns.MOVIE).size()[data.index].fillna(0)
    )
    data = data.rename(
        columns={MovieColumns.RUNTIME: DerivedMovieColumns.RUNTIME_MINUTES}
    )
    data[DerivedMovieColumns.RUNTIME_HOURS] = data[
        DerivedMovieColumns.RUNTIME_MINUTES
    ].apply(lambda x: f"{int(x/60)}:{int(x%60):02d}" if pd.notna(x) else None)
    data = pd.concat([data, are_movies_short(data, noms, categories)], axis="columns")
    data.index.name = "id"
    if idList:
        data = data.loc[idList]
    if json:
        return utils.df_to_jsonable(data, "movies")
    return data


@overload
def get_users(
    storage: StorageManager, idList: list[UserID] | None = None, json=False
) -> pd.DataFrame: ...
@overload
def get_users(
    storage: StorageManager, idList: list[UserID] | None = None, json=True
) -> list[dict]: ...


def get_users(storage: StorageManager, idList: list[UserID] | None = None, json=False):
    data = storage.read("users")
    data = data.drop(columns=["email", "letterboxd"])
    if idList:
        data = data.loc[idList]
    if json:
        return utils.df_to_jsonable(data, "users")
    return data


def get_my_user_data(storage: StorageManager, userId: UserID) -> pd.DataFrame:
    data = storage.read("users")
    data = data.loc[[userId]]
    assert data is not None, "User not found <in get_my_user_data>"
    data[DerivedUserColumns.PROFILE_PIC] = get_user_propic(
        data.at[userId, UserColumns.LETTERBOXD]
    )
    return data


def get_user_propic(letterboxd_username: str) -> str | None:
    try:
        # Get the user's letterboxd profile page
        url = f"https://letterboxd.com/{letterboxd_username}/"
        response = requests.get(url)
        response.raise_for_status()

        # Parse the HTML
        soup = BeautifulSoup(response.text, "html.parser")

        # Find the avatar image
        avatar = soup.find("div", class_="profile-avatar")
        avatar = avatar.find("img") if avatar else None
        if (
            avatar
            and isinstance(avatar, Tag)
            and hasattr(avatar, "attrs")
            and "src" in avatar.attrs
        ):
            return avatar.attrs["src"]

    except (requests.RequestException, AttributeError) as e:
        print(f"Error getting user propic for {letterboxd_username}", e)
        return None


def get_watchdata_by_categories(
    storage: StorageManager, year, userIdList=None, json=False
) -> api_CategoryCompletionsDict:
    # ) -> dict[UserID, list[dict[CatID | Grouping | "numCats", int]]]:
    watchlist = storage.read("watchlist", year)
    categories = storage.read("categories", year)
    nominations = storage.read("nominations", year)
    users = storage.read("users")
    edges = compute_category_watchlist(watchlist, nominations).merge(
        categories[CategoryColumns.GROUPING],
        left_on=NomColumns.CATEGORY,
        right_index=True,
    )
    data = {}
    for user in users.index:
        data[user] = [{}, {}]
        for category in categories.index:
            data[user][0][category] = edges.at[
                edges[WatchlistColumns.USER] == user
                and edges[NomColumns.CATEGORY] == category,
                WatchStatus.SEEN,
            ]
            data[user][1][category] = edges.at[
                edges[WatchlistColumns.USER] == user
                and edges[NomColumns.CATEGORY] == category,
                WatchStatus.TODO,
            ]
        for group in Grouping.values():
            data[user][0][group] = edges.loc[
                edges[WatchlistColumns.USER] == user
                and edges[CategoryColumns.GROUPING] == group,
                WatchStatus.SEEN,
            ].sum()
            data[user][1][group] = edges.loc[
                edges[WatchlistColumns.USER] == user
                and edges[CategoryColumns.GROUPING] == group,
                WatchStatus.TODO,
            ].sum()
        data[user][0]["numCats"]
    return data

    users_to_categories = watchlist.merge(
        nominations, left_on=WatchlistColumns.MOVIE, right_on=NomColumns.MOVIE
    ).merge(categories, left_on=NomColumns.CATEGORY, right_index=True)


def compute_category_watchlist(watchlist, nominations):
    """
    Should return an edge list with columns including:
        userId: UserID
        categoryId: CategoryID
        seen: number of movies that user has seen in that category
        todo: number of movies that user has todo in that category
    """
    users_to_categories = watchlist.merge(
        nominations, left_on=WatchlistColumns.MOVIE, right_on=NomColumns.MOVIE
    )
    result = (
        users_to_categories.groupby(
            [WatchlistColumns.USER, NomColumns.CATEGORY, WatchlistColumns.STATUS]
        )
        .size()
        .unstack(fill_value=0)
        .reset_index()
    )

    return result[
        WatchlistColumns.USER,
        NomColumns.CATEGORY,
        WatchStatus.SEEN,
        WatchStatus.TODO,
    ]


def enrich_watchlist_with_movie_data(
    watchlist: pd.DataFrame, movies_data: pd.Series
) -> pd.DataFrame:
    """
    watchlist: a watchlist-shaped dataframe, perhaps filtered somehow
    movies_data: a Series indexed by MovieID, indicating the property of each movie
    returns: a watchlist-shaped dataframe with the same columns as the input, but with a new column representing the property
    """
    return watchlist.merge(
        movies_data, left_on=WatchlistColumns.MOVIE, right_index=True
    )


def num_seen_with_property(
    enriched_watchlist: pd.DataFrame,
    property: str,
    new_name: str,
    inverse: bool = False,
) -> pd.Series:
    """
    enriched_watchlist: a watchlist-shaped dataframe with an extra boolean column names {property}
    property: the name of the boolean column (must exist!)
    new_name: the name to be given to the Series (since unnamed Series aren't typesafe)
    inverse: if True, returns the number of movies that the user has seen *without* the property
    returns: a series of integers, indexed by UserID, indicating the number of movies that user has seen in that category
    note: 'seen' is a placeholder, it's really how many movies the user has marked (with either status)
    """
    assert (
        property in enriched_watchlist.columns
    ), f"Property {property} not found in enriched_watchlist {enriched_watchlist.columns}, cannot use num_seen_with_property"
    assert (
        WatchlistColumns.USER in enriched_watchlist.columns
    ), f"UserID column not found in enriched_watchlist {enriched_watchlist.columns}, cannot use num_seen_with_property"
    bool_col = enriched_watchlist[property]
    if inverse:
        bool_col = ~bool_col
    return bool_col.groupby(WatchlistColumns.USER).size()  # type: ignore


def compute_user_completion_stats(storage: StorageManager, year) -> pd.DataFrame:
    """
    finds the total number of movies seen and todo by a user
    If the movie list has complete runtime data,
    it also finds the total seen watchtime and the total todo watchtime

    Returns: Dataframe with columns:
        index: UserID
        num_seen_short: int
        num_seen_feature: int
        num_todo_short: int
        num_todo_feature: int
        num_seen_multinom: int
        num_todo_multinom: int
        total_seen_runtime: int (minutes)
        total_todo_runtime: int (minutes)

    """

    movies = storage.read("movies", year)
    nominations = storage.read("nominations", year)
    categories = storage.read("categories", year)
    watchlist = storage.read("watchlist", year)

    seen_watchlist = watchlist.loc[
        watchlist[WatchlistColumns.STATUS] == WatchStatus.SEEN
    ]
    todo_watchlist = watchlist.loc[
        watchlist[WatchlistColumns.STATUS] == WatchStatus.TODO
    ]
    movie_is_short = are_movies_short(movies, nominations, categories)
    movie_is_multinom = are_movies_multinom(nominations)

    enriched_seenlist = enrich_watchlist_with_movie_data(seen_watchlist, movie_is_short)
    enriched_seenlist = enrich_watchlist_with_movie_data(
        enriched_seenlist, movie_is_multinom
    )
    enriched_todolist = enrich_watchlist_with_movie_data(todo_watchlist, movie_is_short)
    enriched_todolist = enrich_watchlist_with_movie_data(
        enriched_todolist, movie_is_multinom
    )

    num_seen_short = num_seen_with_property(
        enriched_seenlist, CategoryColumns.IS_SHORT, DerivedUserColumns.NUM_SEEN_SHORT
    )
    num_seen_feature = num_seen_with_property(
        enriched_seenlist,
        CategoryColumns.IS_SHORT,
        DerivedUserColumns.NUM_SEEN_FEATURE,
        inverse=True,
    )
    num_todo_short = num_seen_with_property(
        enriched_todolist, CategoryColumns.IS_SHORT, DerivedUserColumns.NUM_TODO_SHORT
    )
    num_todo_feature = num_seen_with_property(
        enriched_todolist,
        CategoryColumns.IS_SHORT,
        DerivedUserColumns.NUM_TODO_FEATURE,
        inverse=True,
    )

    num_seen_multinom = num_seen_with_property(
        enriched_seenlist,
        DerivedMovieColumns.IS_MULTI_NOM,
        DerivedUserColumns.NUM_SEEN_MULTINOM,
    )
    num_todo_multinom = num_seen_with_property(
        enriched_todolist,
        DerivedMovieColumns.IS_MULTI_NOM,
        DerivedUserColumns.NUM_TODO_MULTINOM,
    )

    seen_with_runtime = enrich_watchlist_with_movie_data(
        seen_watchlist, movies[MovieColumns.RUNTIME]
    )
    todo_with_runtime = enrich_watchlist_with_movie_data(
        todo_watchlist, movies[MovieColumns.RUNTIME]
    )

    total_seen_runtime = (
        seen_with_runtime.groupby(WatchlistColumns.USER)
        .sum()[MovieColumns.RUNTIME]
        .rename(DerivedUserColumns.SEEN_WATCHTIME)
    )
    total_todo_runtime = (
        todo_with_runtime.groupby(WatchlistColumns.USER)
        .sum()[MovieColumns.RUNTIME]
        .rename(DerivedUserColumns.TODO_WATCHTIME)
    )

    result = pd.concat(
        [
            num_seen_short,
            num_seen_feature,
            num_todo_short,
            num_todo_feature,
            num_seen_multinom,
            num_todo_multinom,
            total_seen_runtime,
            total_todo_runtime,
        ],
        axis="columns",
    )
    result.index.name = "id"
    return result


def get_category_completion_data(storage: StorageManager, year, json=False):
    data = compute_user_completion_stats(storage, year)
    return data.to_dict(orient="index")
