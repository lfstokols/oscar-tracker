import logging
from functools import partial
from typing import Annotated, Type, TypeVar, cast

from fastapi import Depends, HTTPException, Request

import backend.data.queries as qu
from backend.routing_lib.error_handling import APIArgumentError, YearError
from backend.types.api_schemas import UserID
from backend.types.api_validators import validate_user_id


def has_flag(request: Request, arg: str) -> bool:
    """
    returns true if the argument is present and its value
    is "true" (case insensitive)
    """
    value = request.query_params.get(arg, "false").lower()
    output = value == "true"
    return output


def get_active_user_id(request: Request) -> UserID:
    cookie = request.cookies
    if "activeUserId" not in cookie:
        raise APIArgumentError("No active user id", [("activeUserId", "cookie")])
    active_user_id = cookie["activeUserId"]
    id, code = validate_user_id(active_user_id)
    if code != 0:
        logging.error(
            f"Got a request to {request.url}[{request.method}] that needs an active user, but value {active_user_id} is invalid"
        )
        raise APIArgumentError("Invalid active user id", [("activeUserId", "cookie")])
    users = qu.get_users()
    if id not in [user["id"] for user in users]:
        logging.error(
            f"Got a request to {request.url}[{request.method}] with active user {active_user_id}, which IS valid per se, but is NOT in my database"
        )
        request.state.should_delete_cookie = True
        raise APIArgumentError(
            "Invalid active user id (No such user)", [("activeUserId", "cookie")]
        )
    return id


ActiveUserID = Annotated[UserID, Depends(get_active_user_id)]


def get_year(request: Request, body: bool = False) -> int:
    """
    Only call this if you want to throw on a missing / invalid year.
    """
    location = request.query_params if not body else request.json
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


ActiveYear = Annotated[int, Depends(get_year)]

BodyYear = Annotated[int, Depends(partial(get_year, body=True))]

T = TypeVar("T")


def get_param(request: Request, param: str, type_: Type[T] = str) -> T:
    """
    Returns the value of the given parameter from the request.
    Use instead of request.args.get() for type-safety and error-handling.
    """
    value = request.query_params.get(param)
    if value is None:
        raise APIArgumentError(
            f"Missing parameter {param}",
            missing_data=[(param, "query params")],
        )
    try:
        return cast(T, value)
    except ValueError:
        raise APIArgumentError(
            f"Invalid parameter {param}, expected {type_} but got {value}",
            malformed_data=[(param, "query params")],
        )
