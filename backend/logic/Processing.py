import logging
import re

import httpx
import pandas as pd
from bs4 import BeautifulSoup, Tag

from backend.logic.storage_manager import StorageManager
from backend.types.api_schemas import CategoryCompletionKey, MovieID, UserID
from backend.types.my_types import *
from backend.types.my_types import Grouping


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


def are_movies_multinom(nominations: pd.DataFrame) -> pd.Series[bool]:
    return (nominations.groupby(NomColumns.MOVIE.value).size() > 1).rename(
        # pyright: ignore[reportCallIssue, reportArgumentType]
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
    try:
        subtitlePosition = int(subtitlePosition)
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
    except Exception as e:
        logging.error(f"Error breaking into subtitles: {e}")
        return fullTitle, ""


def get_movies(storage: StorageManager, year, idList: list[MovieID] | None = None):
    data = storage.read("movies", year)
    noms = storage.read("nominations", year)
    categories = storage.read("categories")
    data[DerivedMovieColumns.NUM_NOMS.value] = noms.groupby(
        NomColumns.MOVIE.value
    ).size()
    data = data.rename(
        columns={
            MovieColumns.RUNTIME.value: DerivedMovieColumns.RUNTIME_MINUTES.value}
    )
    data[DerivedMovieColumns.RUNTIME_HOURS.value] = data[
        DerivedMovieColumns.RUNTIME_MINUTES.value
    ].apply(lambda x: f"{int(x/60)}:{int(x % 60):02d}" if pd.notna(x) else None)
    data = pd.concat([data, are_movies_short(
        data, noms, categories)], axis="columns")
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


async def get_my_user_data(storage: StorageManager, userId: UserID) -> pd.DataFrame:
    data = storage.read("users")
    data = data.loc[[userId]]
    assert data is not None, "User not found <in get_my_user_data>"
    data[myUserDataColumns.PROFILE_PIC.value] = await get_user_propic(
        data.at[userId, UserColumns.LETTERBOXD.value]
    )
    data.drop(columns=[UserColumns.LAST_CHECKED.value], inplace=True)
    return data


async def get_user_propic(letterboxd_username: str) -> str | None:
    try:
        # Get the user's letterboxd profile page
        url = f"https://letterboxd.com/{letterboxd_username}/"
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
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
    except (httpx.HTTPStatusError, AttributeError) as e:
        logging.error(
            f"Error getting user propic for {letterboxd_username}", e)
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
        categories[[CategoryColumns.GROUPING.value,
                    CategoryColumns.MAX_NOMS.value]],
        left_on=NomColumns.CATEGORY.value,
        right_index=True,
    )
    data: dict[UserID, list[dict[CategoryCompletionKey, int]]] = {}
    for user in users.index:
        data[user] = [{}, {}]
        for category in categories.index:
            data[user][0][category] = (
                edges.loc[
                    (edges[WatchlistColumns.USER.value] == user)
                    & (edges[NomColumns.CATEGORY.value] == category),
                    [WatchStatus.SEEN.value],
                ]
                .sum()
                .sum()
                .item()
            )
            data[user][1][category] = (
                edges.loc[
                    (edges[WatchlistColumns.USER.value] == user)
                    & (edges[NomColumns.CATEGORY.value] == category),
                    [WatchStatus.TODO.value, WatchStatus.SEEN.value],
                ]
                .sum()
                .sum()
                .item()
            )
        for group in list(Grouping):
            data[user][0][group] = (
                edges.loc[
                    (edges[WatchlistColumns.USER.value] == user)
                    & (
                        edges[CategoryColumns.GROUPING.value].astype(
                            str) == group.value
                    ),
                    [WatchStatus.SEEN.value],
                ]
                .sum()
                .item()
            )
            data[user][1][group] = (
                edges.loc[
                    (edges[WatchlistColumns.USER.value] == user)
                    & (
                        edges[CategoryColumns.GROUPING.value].astype(
                            str) == group.value
                    ),
                    [WatchStatus.TODO.value, WatchStatus.SEEN.value],
                ]
                .sum()
                .sum()
                .item()
            )
        data[user][0]["numCats"] = len(
            edges.loc[
                (edges[WatchlistColumns.USER.value] == user)
                & (
                    edges[WatchStatus.SEEN.value]
                    == edges[CategoryColumns.MAX_NOMS.value]
                )
            ]
        )
        data[user][1]["numCats"] = len(
            edges.loc[
                (edges[WatchlistColumns.USER.value] == user)
                & (
                    edges[WatchStatus.TODO.value] +
                    edges[WatchStatus.SEEN.value]
                    == edges[CategoryColumns.MAX_NOMS.value]
                )
            ]
        )
    return data

    users_to_categories = watchlist.merge(
        nominations,
        left_on=WatchlistColumns.MOVIE.value,
        right_on=NomColumns.MOVIE.value,
    ).merge(categories, left_on=NomColumns.CATEGORY.value, right_index=True)


def compute_user_to_category_edgeframe(watchlist, nominations):
    """
    Should return an edge list with columns including:
        userId: UserID
        categoryId: CategoryID
        seen: number of movies that user has seen in that category
        todo: number of movies that user has todo in that category
    """
    users_to_categories = watchlist.merge(
        nominations,
        left_on=WatchlistColumns.MOVIE.value,
        right_on=NomColumns.MOVIE.value,
    )
    result = (
        users_to_categories.groupby(
            [
                WatchlistColumns.USER.value,
                NomColumns.CATEGORY.value,
                WatchlistColumns.STATUS.value,
            ]
        )
        .size()
        .unstack(fill_value=0)
        .reset_index()
    )
    try:
        return result[
            [
                WatchlistColumns.USER.value,
                NomColumns.CATEGORY.value,
                WatchStatus.SEEN.value,
                WatchStatus.TODO.value,
            ]
        ]
    except Exception as e:
        logging.error(e)
        result[WatchStatus.SEEN.value] = 0
        result[WatchStatus.TODO.value] = 0
        return result[
            [
                WatchlistColumns.USER.value,
                NomColumns.CATEGORY.value,
                WatchStatus.SEEN.value,
                WatchStatus.TODO.value,
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
        movies_data, left_on=WatchlistColumns.MOVIE.value, right_index=True
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
        WatchlistColumns.USER.value in enriched_watchlist.columns
    ), f"UserID column not found in enriched_watchlist {enriched_watchlist.columns}, cannot use num_seen_with_property"
    bool_col = enriched_watchlist[property]
    if inverse:
        bool_col = ~bool_col
    # type: ignore
    return enriched_watchlist.loc[bool_col].groupby(WatchlistColumns.USER.value).size().fillna(0).rename(new_name)


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
        watchlist[WatchlistColumns.STATUS.value] == WatchStatus.SEEN.value
    ]
    todo_watchlist = watchlist.loc[
        watchlist[WatchlistColumns.STATUS.value] == WatchStatus.TODO.value
    ]
    movie_is_short = are_movies_short(movies, nominations, categories)
    movie_is_multinom = are_movies_multinom(nominations)

    enriched_seenlist = enrich_watchlist_with_movie_data(
        seen_watchlist, movie_is_short)
    enriched_seenlist = enrich_watchlist_with_movie_data(
        enriched_seenlist, movie_is_multinom
    )
    enriched_todolist = enrich_watchlist_with_movie_data(
        todo_watchlist, movie_is_short)
    enriched_todolist = enrich_watchlist_with_movie_data(
        enriched_todolist, movie_is_multinom
    )

    num_seen_short = num_seen_with_property(
        enriched_seenlist,
        CategoryColumns.IS_SHORT.value,
        UserStatsColumns.NUM_SEEN_SHORT.value,
    )
    num_seen_feature = num_seen_with_property(
        enriched_seenlist,
        CategoryColumns.IS_SHORT.value,
        UserStatsColumns.NUM_SEEN_FEATURE.value,
        inverse=True,
    )
    num_todo_short = num_seen_with_property(
        enriched_todolist,
        CategoryColumns.IS_SHORT.value,
        UserStatsColumns.NUM_TODO_SHORT.value,
    )
    num_todo_feature = num_seen_with_property(
        enriched_todolist,
        CategoryColumns.IS_SHORT.value,
        UserStatsColumns.NUM_TODO_FEATURE.value,
        inverse=True,
    )

    num_seen_multinom = num_seen_with_property(
        enriched_seenlist,
        DerivedMovieColumns.IS_MULTI_NOM.value,
        UserStatsColumns.NUM_SEEN_MULTINOM.value,
    )
    num_todo_multinom = num_seen_with_property(
        enriched_todolist,
        DerivedMovieColumns.IS_MULTI_NOM.value,
        UserStatsColumns.NUM_TODO_MULTINOM.value,
    )

    seen_with_runtime = enrich_watchlist_with_movie_data(
        seen_watchlist, movies[MovieColumns.RUNTIME.value]
    )
    todo_with_runtime = enrich_watchlist_with_movie_data(
        todo_watchlist, movies[MovieColumns.RUNTIME.value]
    )

    total_seen_runtime = (
        seen_with_runtime.groupby(WatchlistColumns.USER.value)
        .sum()[MovieColumns.RUNTIME.value]
        .rename(UserStatsColumns.SEEN_WATCHTIME.value)
    )
    total_todo_runtime = (
        todo_with_runtime.groupby(WatchlistColumns.USER.value)
        .sum()[MovieColumns.RUNTIME.value]
        .rename(UserStatsColumns.TODO_WATCHTIME.value)
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
