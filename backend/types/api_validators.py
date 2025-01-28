from flask import jsonify
import numpy as np
import pandas as pd
from backend.types.api_schemas import *
from backend.types.my_types import DataFlavor
import backend.types.flavors as flv


# def validate_user_id(user_id: str):
#     return UserID(user_id)


def validate_user_list(user_list: list[dict]) -> list[api_User]:
    return [api_User(**record).model_dump() for record in user_list]  # type: ignore


def validate_movie_list(movie_list: list[dict]) -> list[api_Movie]:
    return [api_Movie(**record).model_dump() for record in movie_list]  # type: ignore


def validate_nom_list(nom_list: list[dict]) -> list[api_Nom]:
    return [api_Nom(**record).model_dump() for record in nom_list]  # type: ignore


def validate_category_list(category_list: list[dict]) -> list[api_Category]:
    return [api_Category(**record).model_dump() for record in category_list]  # type: ignore


def validate_watchlist(watchlist: list[dict]) -> list[api_WatchNotice]:
    return [api_WatchNotice(**record).model_dump() for record in watchlist]  # type: ignore


def validate_user_stats_list(user_stats_list: list[dict]) -> list[api_UserStats]:
    return [api_UserStats(**record).model_dump() for record in user_stats_list]  # type: ignore


def validate_my_user_data(my_user_data: dict) -> api_MyUserData:
    return api_MyUserData(**my_user_data).model_dump()  # type: ignore


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
    df = df.replace({pd.NA: None, np.nan: None})
    return df.to_dict(orient="records")
