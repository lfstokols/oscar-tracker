from flask import jsonify
import pandas as pd
from backend.data_management.schemas import *
from backend.logic.MyTypes import DataFlavor
from logic.utils import df_to_jsonable


# def validate_user_id(user_id: str):
#     return UserID(user_id)


def validate_user_list(user_list: pd.DataFrame):
    records = df_to_jsonable(user_list, Flavor.USERS)
    return jsonify([api_User(**record).model_dump() for record in records])


def validate_movie_list(movie_list: pd.DataFrame):
    records = df_to_jsonable(movie_list, Flavor.MOVIES)
    return jsonify([api_Movie(**record).model_dump() for record in records])


def validate_nom_list(nom_list: pd.DataFrame):
    records = df_to_jsonable(nom_list, Flavor.NOMINATIONS)
    return jsonify([api_Nom(**record).model_dump() for record in records])


def validate_category_list(category_list: pd.DataFrame):
    records = df_to_jsonable(category_list, Flavor.CATEGORIES)
    return jsonify([api_Category(**record).model_dump() for record in records])


def validate_watchlist(watchlist: pd.DataFrame):
    records = df_to_jsonable(watchlist, Flavor.WATCHLIST)
    return jsonify([api_WatchNotice(**record).model_dump() for record in records])


def validate_user_stats_list(user_stats_list: pd.DataFrame):
    records = df_to_jsonable(user_stats_list, Flavor.USERS)
    return jsonify([api_UserStats(**record).model_dump() for record in records])


def validate_my_user_data(my_user_data: pd.DataFrame):
    record = df_to_jsonable(my_user_data, Flavor.USERS)[0]
    return jsonify(api_MyUserData(**record).model_dump())
