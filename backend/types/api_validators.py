from flask import jsonify
import numpy as np
import pandas as pd
from backend.types.api_schemas import *
from backend.types.my_types import WatchStatus
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
    category_completion_dict: dict[
        UserID, dict[CategoryCompletionKey, dict[countTypes, int]]
    ]
) -> dict[UserID, api_CategoryCompletions]:
    return {
        UserValidator(user=k).user: api_CategoryCompletions(**v).model_dump()  # type: ignore
        for k, v in category_completion_dict.items()
    }


class AnnotatedValidator(BaseModel):
    movie: Optional[MovieID] = None
    user: Optional[UserID] = None
    category: Optional[CategoryID] = None
    poster_path: Optional[PosterPath] = None


class MovieValidator(BaseModel):
    movie: MovieID


class UserValidator(BaseModel):
    user: UserID


class CategoryValidator(BaseModel):
    category: CategoryID


class PosterPathValidator(BaseModel):
    poster_path: PosterPath
