from backend.logic.MyTypes import *
import backend.logic.utils as utils
import pandas as pd


def are_movies_short(storage, year) -> pd.Series:
    movies = storage.read("movies")
    nominations = storage.read("nominations")
    categories = storage.read("categories")
    shorts = categories.loc[categories[CategoryColumns.SHORT] == 1]
    shortNominees: pd.Series = nominations[NomColumns.MOVIE].loc[nominations[NomColumns.CATEGORY].isin(shorts.index)]
    movies['is_short'] = movies.index.isin(shortNominees.index)
    return movies['is_short']

# assumes there are 3 short categories, and that no short can  be nominated in non-short categories
def get_number_of_movies(storage, year, shortsIsOne=False) -> int:
    total = storage.read("movies", year).shape[0]
    categories = storage.read("categories")
    num_shorts = categories.loc[categories[CategoryColumns.SHORT] == 1][CategoryColumns.MAX_NOMS].sum()
    if shortsIsOne:
        return total - num_shorts + 3
    return total

def get_movies(storage, year, idList=None, json=False):
    data = storage.read("movies", year)
    noms = storage.read("nominations", year)
    data[MovieColumns.NUM_NOMS] = (
        noms.groupby(NomColumns.MOVIE).size()[data.index].fillna(0)
    )
    data = data.rename(columns={MovieColumns.RUNTIME: MovieColumns.RUNTIME_MINUTES})
    data[MovieColumns.RUNTIME_HOURS] = data[MovieColumns.RUNTIME_MINUTES].apply(
        lambda x: f"{int(x/60)}:{int(x%60):02d}" if pd.notna(x) else None
    )
    if idList:
        data = data.loc[idList]
    if json:
        return storage.df_to_jsonable(data, "movies")
    return data

def get_users(storage, idList=None, json=False):
    data = storage.read("users")
    data = data.drop(columns=['email', 'letterboxd'])
    if idList:
        data = data.loc[idList]
    if json:
        return utils.df_to_jsonable(storage,data, "users")
    return data
def get_my_user_data(storage, userId, json=False):
    data = storage.read("users")
    data = data.loc[userId]
    if json:
        return utils.df_to_jsonable(storage,data, "users")
    return data

def get_watchdata_by_categories(storage, year, userIdList=None, json=False):
    data = storage.read("watchlist", year)
    if userIdList:
        data = data.loc[userIdList]

    data = data.groupby([WatchlistColumns.USER, WatchlistColumns.CATEGORY]).size()
    if json:
        return utils.df_to_jsonable(storage,data, "watchlist")
    return data

def compute_watchlist_by_category(watchlist, categories):
    pass

# finds the total number of movies watched by a user
# If the movie list has complete runtime data,
# it also finds the total seen watchtime and the total todo watchtime
def compute_user_completion_stats(userId, watchlist, movies):
    num_movies = watchlist.loc[userId].shape[0]
    if MovieColumns.RUNTIME in movies.columns and not movies[MovieColumns.RUNTIME].isna().any():
        seen_watchtime = movies[MovieColumns.RUNTIME_MINUTES].\
            loc[watchlist[
                (watchlist[WatchlistColumns.USER] == userId) & 
                (watchlist[WatchlistColumns.STATUS] == WatchStatus.SEEN)
            ][WatchlistColumns.MOVIE]].\
            sum()
        todo_watchtime = movies[MovieColumns.RUNTIME_MINUTES].\
            loc[watchlist.loc[userId==userId & watchlist.loc[userId==WatchlistColumns.TODO]]].\
            sum()
    else:
        seen_watchtime = None
        todo_watchtime = None
    return num_movies, seen_watchtime, todo_watchtime