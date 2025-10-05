import logging
import time
from functools import wraps
from pprint import pformat
from typing import Any, Callable

from fastapi import FastAPI, Request, Response
from pydantic import ValidationError
from sqlalchemy.exc import OperationalError

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


# def no_year_response():
#     return (jsonify({"error": "No year provided"}), 422)


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


class externalAPIError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)


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
        return func(*args, **kwargs), 200
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


# def handle_errors(func):
#     @wraps(func)
#     def wrapper(*args, **kwargs):
#         try:
#             return func(*args, **kwargs)
#         except OperationalError as e:
#             if "database is locked" in str(e):
#                 logging.warning(
#                     f"Locked database [SQLITE_BUSY]: {func.__name__}({args}, {kwargs}) failed at {time.time()}"
#                 )
#                 return LockedFileResponse
#         except OSError as e:
#             if e.errno == 13:
#                 logging.warning(
#                     f"Locked file [Errno 13]: {func.__name__}({args}, {kwargs}) failed at {time.time()}"
#                 )
#                 return LockedFileResponse
#         except ValidationError as e:
#             logging.error(
#                 f"Pydantic validation failed in {func.__name__}({args}, {kwargs}):\n {pformat(e.errors())}"
#             )
#             return (
#                 {"error": "Pydantic validation failed", "message": str(e)},
#                 env.PYDANTIC_ERROR_STATUS_CODE,
#             )
#         except APIArgumentError as e:
#             logging.warning(
#                 f"APIArgumentError: {e.message}",
#                 f"Missing data: {e.missing_data}",
#                 f"Malformed data: {e.malformed_data}",
#             )

#             response = Response()
#             body = {
#                 "error": e.message,
#                 "missing_data": e.missing_data,
#                 "malformed_data": e.malformed_data,
#             }
#             response.status_code = 422
#             if g.should_delete_cookie:
#                 logging.info(
#                     f"Deleting malformed activeUserId cookie. Active user id was <{g.get('initial_user_id_value')}>"
#                 )
#                 response.delete_cookie("activeUserId")
#                 body["message"] = "Invalid activeUserId in cookie was deleted."
#             response.body = body
#             return response

#         except Exception as e:
#             logging.error(
#                 f"Request yielded uncaught error while running {func.__name__}({args}, {kwargs})"
#             )
#             logging.error(f"Error of type {type(e)} with message {e}")
#             raise

#     return wrapper


def apply_error_handling(app: FastAPI):
    @app.exception_handler(OperationalError)
    async def sqlite_locked_handler(request: Request, exc: OperationalError):
        if "database is locked" in str(exc):
            logging.warning(
                f"Locked database [SQLITE_BUSY]: {request} failed at {time.time()}"
            )
            return LockedFileResponse
        raise

    @app.exception_handler(OSError)
    async def file_locked_handler(request: Request, exc: OSError):
        if exc.errno == 13:
            logging.warning(
                f"Locked file [Errno 13]: {request} failed at {time.time()}"
            )
            return LockedFileResponse
        raise

    # @app.exception_handler(ValidationError) [I'm hoping FastAPI's Pydantic integration handles this]
    @app.exception_handler(APIArgumentError)
    async def custom_argument_error_handler(request: Request, exc: APIArgumentError):
        logging.warning(
            f"APIArgumentError: {exc.message}",
            f"Missing data: {exc.missing_data}",
            f"Malformed data: {exc.malformed_data}",
        )
        should_delete_cookie = request.state.should_delete_cookie
        body: dict[str, Any] = {
            "error": exc.message,
            "missing_data": exc.missing_data,
            "malformed_data": exc.malformed_data,
        }
        if should_delete_cookie:
            # Announce before doing
            logging.info(
                f"Deleting malformed activeUserId cookie. Active user id was <{request.state.initial_user_id_value}>"
            )
            body["message"] = "Invalid activeUserId in cookie was deleted."

        response = Response(status_code=422, content=body)
        if should_delete_cookie:
            response.delete_cookie("activeUserId")
        return response
