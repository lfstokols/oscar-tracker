import re
from typing import Hashable, overload, Any
from backend.data_management.api_schemas import (
    api_CategoryCompletionsDict,
    MovieID,
    CategoryCompletionKey,
)
import requests
from bs4 import BeautifulSoup, Tag
import pandas as pd
from backend.logic.MyTypes import Grouping
import backend.logic.utils as utils
from backend.logic.storage_manager import StorageManager
from backend.logic.MyTypes import *
from backend.data_management.api_schemas import UserID


def are_movies_short(
    movies: pd.DataFrame, nominations: pd.DataFrame, categories: pd.DataFrame
) -> pd.Series:
    """
    Returns a boolean series indicating if each movie has any short nominations
    index: MovieID
    columns name: CategoryColumns.IS_SHORT
    """
    enriched_nominations = nominations.merge(
        categories, left_on=NomColumns.CATEGORY.value, right_index=True
    )
    num_short_noms = enriched_nominations.groupby(NomColumns.MOVIE.value)[
        CategoryColumns.IS_SHORT.value
    ].sum()
    return (num_short_noms > 0).rename(DerivedMovieColumns.IS_SHORT.value)


def are_movies_multinom(nominations: pd.DataFrame) -> pd.Series:
    return (nominations.groupby(NomColumns.MOVIE.value).size() > 1).rename(
        DerivedMovieColumns.IS_MULTI_NOM.value
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
    num_shorts = categories.loc[categories[CategoryColumns.IS_SHORT.value] == 1][
        CategoryColumns.MAX_NOMS.value
    ].sum()
    if shortsIsOne:
        return total - num_shorts + 3
    return total


def break_into_subtitles(fullTitle: str, subtitlePosition: int) -> tuple[str, str]:
    if subtitlePosition == -1:
        return fullTitle, ""
    mainTitle = fullTitle[:subtitlePosition].strip()
    subtitle = fullTitle[subtitlePosition:]
    subtitle = re.search(r"(\w.*)$", subtitle)
    if subtitle:
        subtitle = subtitle.group(0).strip()
    else:
        subtitle = ""
    return mainTitle, subtitle


def get_movies(storage: StorageManager, year, idList: list[MovieID] | None = None):
    data = storage.read("movies", year)
    noms = storage.read("nominations", year)
    categories = storage.read("categories")
    data[DerivedMovieColumns.NUM_NOMS.value] = noms.groupby(
        NomColumns.MOVIE.value
    ).size()
    data = data.rename(
        columns={MovieColumns.RUNTIME.value: DerivedMovieColumns.RUNTIME_MINUTES.value}
    )
    data[DerivedMovieColumns.RUNTIME_HOURS.value] = data[
        DerivedMovieColumns.RUNTIME_MINUTES.value
    ].apply(lambda x: f"{int(x/60)}:{int(x%60):02d}" if pd.notna(x) else None)
    data = pd.concat([data, are_movies_short(data, noms, categories)], axis="columns")
    titles_df = pd.DataFrame(
        data[[MovieColumns.TITLE.value, MovieColumns.SUBTITLE_POSITION.value]].apply(
            lambda x: break_into_subtitles(
                x[MovieColumns.TITLE.value], x[MovieColumns.SUBTITLE_POSITION.value]
            ),
            axis="columns",
            result_type="expand",
        ),
        dtype=str,
    ).rename(
        columns={
            0: DerivedMovieColumns.MAIN_TITLE.value,
            1: DerivedMovieColumns.SUBTITLE.value,
        }
    )
    data = pd.concat([data, titles_df], axis="columns")
    data = data.drop(columns=[MovieColumns.SUBTITLE_POSITION.value])
    data.index.name = "id"
    if idList:
        data = data.loc[idList]
    return data


def get_users(storage: StorageManager, idList: list[UserID] | None = None):
    data = storage.read("users")
    data = data.drop(columns=["email", "letterboxd"])
    if idList:
        data = data.loc[idList]
    return data


def get_my_user_data(storage: StorageManager, userId: UserID) -> pd.DataFrame:
    data = storage.read("users")
    data = data.loc[[userId]]
    assert data is not None, "User not found <in get_my_user_data>"
    data[myUserDataColumns.PROFILE_PIC] = get_user_propic(
        data.at[userId, UserColumns.LETTERBOXD]
    )
    data.drop(columns=[UserColumns.LAST_CHECKED], inplace=True)
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
        return None
    except (requests.RequestException, AttributeError) as e:
        print(f"Error getting user propic for {letterboxd_username}", e)
        return None


def get_category_completion_dict(
    storage: StorageManager, year
) -> dict[UserID, list[dict[CategoryCompletionKey, int]]]:
    """
    This is for the 'by category' view.
    Returns a dict with keys as UserIDs and values as
            dicts with mapping category names + etc to ints
            representing the number of movies seen in that 'category'
    """
    watchlist = storage.read("watchlist", year)
    categories = storage.read("categories", year)
    nominations = storage.read("nominations", year)
    users = storage.read("users")
    edges = compute_user_to_category_edgeframe(watchlist, nominations).merge(
        categories[[CategoryColumns.GROUPING, CategoryColumns.MAX_NOMS]],
        left_on=NomColumns.CATEGORY,
        right_index=True,
    )
    data: dict[UserID, list[dict[CategoryCompletionKey, int]]] = {}
    for user in users.index:
        data[user] = [{}, {}]
        for category in categories.index:
            data[user][0][category] = (
                edges.loc[
                    (edges[WatchlistColumns.USER] == user)
                    & (edges[NomColumns.CATEGORY] == category),
                    [WatchStatus.SEEN],
                ]
                .sum()
                .sum()
                .item()
            )
            data[user][1][category] = (
                edges.loc[
                    (edges[WatchlistColumns.USER] == user)
                    & (edges[NomColumns.CATEGORY] == category),
                    [WatchStatus.TODO, WatchStatus.SEEN],
                ]
                .sum()
                .sum()
                .item()
            )
        for group in list(Grouping):
            data[user][0][group] = (
                edges.loc[
                    (edges[WatchlistColumns.USER] == user)
                    & (edges[CategoryColumns.GROUPING].astype(str) == group.value),
                    [WatchStatus.SEEN],
                ]
                .sum()
                .item()
            )
            data[user][1][group] = (
                edges.loc[
                    (edges[WatchlistColumns.USER] == user)
                    & (edges[CategoryColumns.GROUPING].astype(str) == group.value),
                    [WatchStatus.TODO, WatchStatus.SEEN],
                ]
                .sum()
                .sum()
                .item()
            )
        data[user][0]["numCats"] = len(
            edges.loc[
                (edges[WatchlistColumns.USER] == user)
                & (edges[WatchStatus.SEEN] == edges[CategoryColumns.MAX_NOMS])
            ]
        )
        data[user][1]["numCats"] = len(
            edges.loc[
                (edges[WatchlistColumns.USER] == user)
                & (
                    edges[WatchStatus.TODO] + edges[WatchStatus.SEEN]
                    == edges[CategoryColumns.MAX_NOMS]
                )
            ]
        )
    return data

    users_to_categories = watchlist.merge(
        nominations, left_on=WatchlistColumns.MOVIE, right_on=NomColumns.MOVIE
    ).merge(categories, left_on=NomColumns.CATEGORY, right_index=True)


def compute_user_to_category_edgeframe(watchlist, nominations):
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
        [
            WatchlistColumns.USER,
            NomColumns.CATEGORY,
            WatchStatus.SEEN,
            WatchStatus.TODO,
        ]
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
    enriched_watchlist: a watchlist-shaped dataframe with an extra boolean column named {property}
    property: the name of the boolean column (must exist!)
    new_name: the name to be given to the Series (since unnamed Series aren't typesafe)
    inverse: if True, returns the number of movies that the user has seen *without* the property
    returns: a series of integers, indexed by UserID, indicating the number of movies that user has seen with the property
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
    return enriched_watchlist.loc[bool_col].groupby(WatchlistColumns.USER).size().fillna(0).rename(new_name)  # type: ignore


def compute_user_stats(storage: StorageManager, year) -> pd.DataFrame:
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
        multinom_seen: int
        multinom_todo: int

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
        enriched_seenlist, CategoryColumns.IS_SHORT, UserStatsColumns.NUM_SEEN_SHORT
    )
    num_seen_feature = num_seen_with_property(
        enriched_seenlist,
        CategoryColumns.IS_SHORT,
        UserStatsColumns.NUM_SEEN_FEATURE,
        inverse=True,
    )
    num_todo_short = num_seen_with_property(
        enriched_todolist, CategoryColumns.IS_SHORT, UserStatsColumns.NUM_TODO_SHORT
    )
    num_todo_feature = num_seen_with_property(
        enriched_todolist,
        CategoryColumns.IS_SHORT,
        UserStatsColumns.NUM_TODO_FEATURE,
        inverse=True,
    )

    num_seen_multinom = num_seen_with_property(
        enriched_seenlist,
        DerivedMovieColumns.IS_MULTI_NOM,
        UserStatsColumns.NUM_SEEN_MULTINOM,
    )
    num_todo_multinom = num_seen_with_property(
        enriched_todolist,
        DerivedMovieColumns.IS_MULTI_NOM,
        UserStatsColumns.NUM_TODO_MULTINOM,
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
        .rename(UserStatsColumns.SEEN_WATCHTIME)
    )
    total_todo_runtime = (
        todo_with_runtime.groupby(WatchlistColumns.USER)
        .sum()[MovieColumns.RUNTIME]
        .rename(UserStatsColumns.TODO_WATCHTIME)
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
    ).infer_objects()
    result.index.name = "id"
    return result


def get_user_stats(storage: StorageManager, year) -> pd.DataFrame:
    return compute_user_stats(storage, year)
    return data.to_dict(orient="records")
