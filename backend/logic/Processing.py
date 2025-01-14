from backend.logic.MyTypes import *
import requests
from bs4 import BeautifulSoup
import pandas as pd
import backend.logic.utils as utils
from backend.logic.StorageManager import StorageManager
from backend.logic.MyTypes import *


def are_movies_short(storage, year) -> pd.Series:
    movies = storage.read("movies")
    nominations = storage.read("nominations")
    categories = storage.read("categories")
    shorts = categories.loc[categories[CategoryColumns.SHORT] == 1]
    shortNominees: pd.Series = nominations[NomColumns.MOVIE].loc[
        nominations[NomColumns.CATEGORY].isin(shorts.index)
    ]
    movies["is_short"] = movies.index.isin(shortNominees.index)
    return movies["is_short"]


# assumes there are 3 short categories, and that no short can  be nominated in non-short categories
def get_number_of_movies(storage, year, shortsIsOne=False) -> int:
    total = storage.read("movies", year).shape[0]
    categories = storage.read("categories")
    num_shorts = categories.loc[categories[CategoryColumns.SHORT] == 1][
        CategoryColumns.MAX_NOMS
    ].sum()
    if shortsIsOne:
        return total - num_shorts + 3
    return total


def get_movies(storage, year, idList=None, json=False):
    data = storage.read("movies", year)
    noms = storage.read("nominations", year)
    data[DerivedMovieColumns.NUM_NOMS] = (
        noms.groupby(NomColumns.MOVIE).size()[data.index].fillna(0)
    )
    data = data.rename(
        columns={MovieColumns.RUNTIME: DerivedMovieColumns.RUNTIME_MINUTES}
    )
    data[DerivedMovieColumns.RUNTIME_HOURS] = data[
        DerivedMovieColumns.RUNTIME_MINUTES
    ].apply(lambda x: f"{int(x/60)}:{int(x%60):02d}" if pd.notna(x) else None)
    if idList:
        data = data.loc[idList]
    if json:
        return utils.df_to_jsonable(data, "movies")
    return data


def get_users(storage: StorageManager, idList: list[UserID] | None = None, json=False):
    data = storage.read("users")
    data = data.drop(columns=["email", "letterboxd"])
    if idList:
        data = data.loc[idList]
    if json:
        return utils.df_to_jsonable(data, "users")
    return data


def get_my_user_data(
    storage: StorageManager, userId: UserID, json=False
) -> pd.DataFrame | dict:
    data = storage.read("users")
    data = data.loc[[userId]]
    assert data is not None, "User not found <in get_my_user_data>"
    data[DerivedUserColumns.PROFILE_PIC] = get_user_propic(
        data.at[userId, UserColumns.LETTERBOXD]
    )
    if json:
        output = utils.df_to_jsonable(data, "users")
        assert len(output) == 1, f"Expected 1 user, got {len(output)}"
        return output[0]
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
        avatar = soup.find("div", class_="profile-avatar").find("img")
        if avatar and "src" in avatar.attrs:
            return avatar["src"]

    except (requests.RequestException, AttributeError) as e:
        print(f"Error getting user propic for {letterboxd_username}", e)
        return None


def get_watchdata_by_categories(storage, year, userIdList=None, json=False):
    data = storage.read("watchlist", year)
    if userIdList:
        data = data.loc[userIdList]

    data = data.groupby([WatchlistColumns.USER, WatchlistColumns.CATEGORY]).size()
    if json:
        return utils.df_to_jsonable(data, "watchlist")
    return data


def compute_watchlist_by_category(watchlist, categories):
    pass


def compute_user_completion_stats(watchlist: pd.DataFrame, movies: pd.DataFrame):
    """
    finds the total number of movies seen and todo by a user
    If the movie list has complete runtime data,
    it also finds the total seen watchtime and the total todo watchtime

    Returns: Dataframe with columns:
        index: UserID
        num_seen: int
        num_todo: int
        seen_watchtime: int (minutes)
    \    todo_watchtime: int (minutes)

    """
    seen_watchlist = watchlist.loc[
        watchlist[WatchlistColumns.STATUS] == WatchStatus.SEEN
    ]
    todo_watchlist = watchlist.loc[
        watchlist[WatchlistColumns.STATUS] == WatchStatus.TODO
    ]

    num_seen = seen_watchlist.groupby(WatchlistColumns.USER).size()
    num_todo = todo_watchlist.groupby(WatchlistColumns.USER).size()

    runtime_seen_watchlist = seen_watchlist.merge(
        movies[MovieColumns.RUNTIME], left_on=WatchlistColumns.MOVIE, right_index=True
    )
    runtime_todo_watchlist = todo_watchlist.merge(
        movies[MovieColumns.RUNTIME], left_on=WatchlistColumns.MOVIE, right_index=True
    )

    runtime_seen_watchlist[MovieColumns.RUNTIME] = runtime_seen_watchlist[
        MovieColumns.RUNTIME
    ].fillna(0)
    runtime_todo_watchlist[MovieColumns.RUNTIME] = runtime_todo_watchlist[
        MovieColumns.RUNTIME
    ].fillna(0)

    seen_watchtime = runtime_seen_watchlist.groupby(WatchlistColumns.USER)[
        MovieColumns.RUNTIME
    ].sum()
    todo_watchtime = runtime_todo_watchlist.groupby(WatchlistColumns.USER)[
        MovieColumns.RUNTIME
    ].sum()

    return pd.concat(
        {
            DerivedUserColumns.NUM_SEEN: num_seen,
            DerivedUserColumns.NUM_TODO: num_todo,
            DerivedUserColumns.SEEN_WATCHTIME: seen_watchtime,
            DerivedUserColumns.TODO_WATCHTIME: todo_watchtime,
        },
        axis="columns",
    )


def get_user_completion_data(storage: StorageManager, year, json=False):
    users = get_users(storage)
    watchlist = storage.read("watchlist", year)
    movies = storage.read("movies", year)
    newdata = compute_user_completion_stats(watchlist, movies)
    data = pd.concat([users, newdata], axis="columns")
    print(data)
    if json:
        return utils.df_to_jsonable(data, "users")
    return data
