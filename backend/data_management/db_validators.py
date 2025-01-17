import pandera as pa
import pandas as pd
from backend.data_management.db_schemas import *


def validate_user_df(user_df: pd.DataFrame):
    return db_User.validate(user_df)


def validate_movie_df(movie_df: pd.DataFrame):
    return db_Movie.validate(movie_df)


def validate_category_df(category_df: pd.DataFrame):
    return db_Category.validate(category_df)


def validate_nom_df(nom_df: pd.DataFrame):
    return db_Nom.validate(nom_df)


def validate_watchlist_df(watchlist_df: pd.DataFrame):
    return db_Watchlist.validate(watchlist_df)
