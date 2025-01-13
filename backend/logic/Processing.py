from backend.logic.MyTypes import MovieColumns, NomColumns
import backend.logic.utils as utils
import pandas as pd


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