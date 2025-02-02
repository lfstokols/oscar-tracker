import logging
from pprint import pformat
from flask import g, jsonify, make_response
from typing import Any, Callable
from sqlalchemy.exc import OperationalError
import time
from functools import wraps
from pydantic import ValidationError

import backend.utils.env_reader as env


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
            logging.error(f"Pydantic validation failed in {func.__name__}({args}, {kwargs}):\n {pformat(e.errors())}")
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

            response = make_response()
            body = (
                {
                    "error": e.message,
                    "missing_data": e.missing_data,
                    "malformed_data": e.malformed_data,
                }
            )
            response.status_code = 422
            if g.get("should_delete_cookie", False):
                logging.info(f"Deleting malformed activeUserId cookie. Active user id was <{g.get('initial_user_id_value')}>")
                response.delete_cookie("activeUserId")
                body["message"] = "Invalid activeUserId in cookie was deleted."
            response.data = jsonify(body)
            return response

        except Exception as e:
            logging.error(
                f"Request yielded uncaught error while running {func.__name__}({args}, {kwargs})"
            )
            logging.error(f"Error of type {type(e)} with message {e}")
            raise

    return wrapper
