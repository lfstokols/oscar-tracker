from flask import jsonify
import numpy as np
import pandas as pd
from backend.data_management.api_schemas import *
from backend.logic.MyTypes import DataFlavor
import backend.logic.Flavors as flv


# def validate_user_id(user_id: str):
#     return UserID(user_id)


def validate_user_list(user_list: pd.DataFrame) -> list[api_User]:
    records = df_to_jsonable(user_list, Flavor.USERS)
    return [api_User(**record).model_dump() for record in records]  # type: ignore


def validate_movie_list(movie_list: pd.DataFrame) -> list[api_Movie]:
    records = df_to_jsonable(movie_list, Flavor.MOVIES)
    return [api_Movie(**record).model_dump() for record in records]  # type: ignore


def validate_nom_list(nom_list: pd.DataFrame) -> list[api_Nom]:
    records = df_to_jsonable(nom_list, Flavor.NOMINATIONS)
    return [api_Nom(**record).model_dump() for record in records]  # type: ignore


def validate_category_list(category_list: pd.DataFrame) -> list[api_Category]:
    records = df_to_jsonable(category_list, Flavor.CATEGORIES)
    return [api_Category(**record).model_dump() for record in records]  # type: ignore


def validate_watchlist(watchlist: pd.DataFrame) -> list[api_WatchNotice]:
    records = df_to_jsonable(watchlist, Flavor.WATCHLIST)
    return [api_WatchNotice(**record).model_dump() for record in records]  # type: ignore


def validate_user_stats_list(user_stats_list: pd.DataFrame) -> list[api_UserStats]:
    records = df_to_jsonable(user_stats_list, Flavor.USERS)
    return [api_UserStats(**record).model_dump() for record in records]  # type: ignore


def validate_my_user_data(my_user_data: pd.DataFrame):
    record = df_to_jsonable(my_user_data, Flavor.USERS)[0]
    return api_MyUserData(**record).model_dump()


def validate_category_completion_dict(
    category_completion_dict: dict[UserID, list[dict[CategoryCompletionKey, int]]]
) -> dict[UserID, list[dict[CategoryCompletionKey, int]]]:
    return category_completion_dict
    # return api_CategoryCompletionsDict(
    #     root={
    #         UserID(k): list[api_CategoryCompletions(root=v.to_dict())]
    #         for k, v in category_completion_dict.items()
    #     }
    # ).model_dump()


class AnnotatedValidator(BaseModel):
    movie: Optional[MovieID] = None
    user: Optional[UserID] = None
    category: Optional[CategoryID] = None
    poster_path: Optional[PosterPath] = None


def df_to_jsonable(df: pd.DataFrame, flavor: Flavor) -> list[dict]:
    """
    Converts a pandas DataFrame to a list of dictionaries.
    It's not a json, but it's easily castable to json.
    """
    # flavor = flv.format_flavor(flavor)
    if flv.flavor_props(flavor)["shape"] == "entity":
        df = df.reset_index()
    df = df.replace({np.nan: None})
    return df.to_dict(orient="records")
