from collections.abc import Callable
import re
import time
from typing import Any
from flask import jsonify, Request
import numpy as np
import pandas as pd
from backend.data_management.api_schemas import Flavor
from backend.logic.StorageManager import StorageManager
import backend.logic.Flavors as flv
from backend.logic.MyTypes import *


class MissingAPIArgumentError(Exception):
    def __init__(self, message: str, missing_data: list[tuple[str, str]]):
        """
        missing_data is a list of tuples, of the form
        (argument_name, location)
        Example: [("year", "query params"), ("userId", "body")]
        """
        self.message = message
        self.missing_data = missing_data
        super().__init__(self.message)


def no_year_response():
    return (jsonify({"error": "No year provided"}), 422)


class YearError(MissingAPIArgumentError):
    def __init__(self, location: str = "query params"):
        message = "No year provided in API call"
        missing_data = [("year", location)]
        super().__init__(message, missing_data)


# FYI: errno 13 is the error number for permission denied, which includes file locking issues
# Code 423 is the HTTP status code for "Locked". Srsly, that exists.
def catch_file_locked_error(
    func: Callable[..., Any], *args, **kwargs
) -> tuple[Any, int]:
    """
    Wraps a function to catch file locking errors and return a 423 status code.

        Args:
                func, *args, **kwargs

        Returns:
                jsonify(func(*args, **kwargs))
    """
    try:
        return jsonify(func(*args, **kwargs)), 200
    except OSError as e:
        if e.errno == 13:
            print(
                f"Locked file [Errno 13]: {func.__name__}({args}, {kwargs}) failed at {time.time()}"
            )
            return {
                "error": "File is locked, please try again later",
                "retryable": "true",
            }, 423
        raise


def df_to_jsonable(df: pd.DataFrame, flavor: DataFlavor) -> list[dict]:
    """
    Converts a pandas DataFrame to a list of dictionaries.
    It's not a json, but it's easily castable to json.
    """
    flavor = flv.format_flavor(flavor)
    if flv.flavor_props(flavor)["shape"] == "entity":
        df = df.reset_index()
    df = df.replace({np.nan: None})
    return df.to_dict(orient="records")


def has_flag(request: Request, arg: str) -> bool:
    """
    returns true if the argument is present and its value
    is "true" (case insensitive)
    """
    value = request.args.get(arg, "false").lower()
    output = value == "true"
    # print(f"has_flag will return {output}")
    return output


def get_active_user_id(storage: StorageManager, request: Request) -> UserID | None:
    active_user_id = request.cookies.get("activeUserId")
    if active_user_id is None:
        return None
    if not re.fullmatch(r"^usr_[0-9a-fA-F]{6}$", active_user_id):
        return None
    users = storage.read("users")
    if active_user_id not in users.index:
        return None
    return UserID(active_user_id)
