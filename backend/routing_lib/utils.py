from collections.abc import Callable
import logging
import re
from sqlite3 import OperationalError
import time
from typing import Any
from flask import jsonify, Request
from flask.cli import F
import numpy as np
import pandas as pd
from functools import wraps
from pydantic import ValidationError
import backend.utils.env_reader as env
from backend.types.api_schemas import Flavor, UserID
from backend.types.api_validators import AnnotatedValidator
import backend.types.flavors as flv
from backend.types.my_types import *
import backend.data.queries as qu


class APIArgumentError(Exception):
    def __init__(
        self,
        message: str,
        missing_data: list[tuple[str, str]] = [],
        malformed_data: list[tuple[str, str]] = [],
    ):
        """
        missing_data is a list of tuples, of the form
        (argument_name, location)
        Example: [("year", "query params"), ("userId", "body")]
        """
        self.message = message
        self.missing_data = missing_data
        self.malformed_data = malformed_data
        super().__init__(self.message)


def no_year_response():
    return (jsonify({"error": "No year provided"}), 422)


class YearError(APIArgumentError):
    def __init__(self, location: str = "query params"):
        message = "No year provided in API call"
        missing_data = [("year", location)]
        super().__init__(message, missing_data)


# FYI: errno 13 is the error number for permission denied, which includes file locking issues
# Code 423 is the HTTP status code for "Locked". Srsly, that exists.
LockedFileResponse = (
    {
        "error": "File is locked, please try again later",
        "retryable": "true",
    },
    423,
)


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
    except OperationalError as e:
        if "database is locked" in str(e):
            logging.error(
                f"Locked database [SQLITE_BUSY]: {func.__name__}({args}, {kwargs}) failed at {time.time()}"
            )
            return LockedFileResponse
        raise
    except OSError as e:
        if e.errno == 13:
            logging.error(
                f"Locked file [Errno 13]: {func.__name__}({args}, {kwargs}) failed at {time.time()}"
                + f"Uncaught. Error bubbled up to API."
            )
            return LockedFileResponse
        raise


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


def has_flag(request: Request, arg: str) -> bool:
    """
    returns true if the argument is present and its value
    is "true" (case insensitive)
    """
    value = request.args.get(arg, "false").lower()
    output = value == "true"
    return output


def get_active_user_id(request: Request) -> UserID | None:
    active_user_id = request.cookies.get("activeUserId")
    if active_user_id is None:
        return None
    if not re.fullmatch(r"^usr_[0-9a-fA-F]{6}$", active_user_id):
        return None
    users = qu.get_users()
    if active_user_id not in [user["id"] for user in users]:
        return None
    active_user_id = AnnotatedValidator(user=active_user_id).user
    return active_user_id


def get_year(request: Request, body: bool = False) -> int:
    """
    Only call this if you want to throw on a missing / invalid year.
    """
    location = request.args if not body else request.json
    if not location or not (year := location.get("year")):
        raise YearError() if not body else YearError(location="body")
    try:
        year = int(year)
    except ValueError:
        raise APIArgumentError(
            "Year must be an integer",
            malformed_data=[("year", "query params" if not body else "body")],
        )
    return year


def handle_errors(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except OperationalError as e:
            if "database is locked" in str(e):
                logging.warning(
                    f"Locked database [SQLITE_BUSY]: {func.__name__}({args}, {kwargs}) failed at {time.time()}"
                )
                return LockedFileResponse
        except OSError as e:
            if e.errno == 13:
                logging.warning(
                    f"Locked file [Errno 13]: {func.__name__}({args}, {kwargs}) failed at {time.time()}"
                )
                return LockedFileResponse
        except ValidationError as e:
            logging.warning(f"Pydantic validation failed: {e.errors()}")
            return (
                jsonify({"error": "Pydantic validation failed", "message": str(e)}),
                env.PYDANTIC_ERROR_STATUS_CODE,
            )
        except APIArgumentError as e:
            logging.warning(
                f"APIArgumentError: {e.message}",
                f"Missing data: {e.missing_data}",
                f"Malformed data: {e.malformed_data}",
            )
            return (
                jsonify(
                    {
                        "error": e.message,
                        "missing_data": e.missing_data,
                        "malformed_data": e.malformed_data,
                    }
                ),
                422,
            )
        except Exception as e:
            logging.error(
                f"Request yielded uncaught error while running {func.__name__}({args}, {kwargs})"
            )
            logging.error(f"Error of type {type(e)} with message {e}")
            raise

    return wrapper
