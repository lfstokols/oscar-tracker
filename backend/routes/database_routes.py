import logging
from functools import wraps
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse

import backend.data.mutations as mu
import backend.data.queries as qu
import backend.routing_lib.request_parser as parser
from backend.routes.forwarding import router as forwarding_router
from backend.routes.hooks import router as hooks_router
from backend.routing_lib.error_handling import APIArgumentError, handle_errors
from backend.routing_lib.user_session import UserSession
from backend.types.api_schemas import UserID
from backend.types.api_validators import (
    UserValidator,
    validate_category_completion_dict,
    validate_category_list,
    validate_movie_id,
    validate_movie_list,
    validate_my_user_data,
    validate_nom_list,
    validate_user_id,
    validate_user_list,
    validate_user_stats_list,
    validate_watchlist,
    validate_watchstatus,
)
from backend.types.my_types import *

router = APIRouter()

router.include_router(forwarding_router, prefix="/forward")
router.include_router(hooks_router, prefix="/hooks")


# Serve data
@router.get("/nominations")
@handle_errors
async def serve_noms(request: Request) -> :
    year = parser.get_year(request)
    data = qu.get_noms(year)
    return validate_nom_list(data)


@router.get("/movies")
@handle_errors
async def serve_movies(request: Request):
    year = parser.get_year(request)
    data = qu.get_movies(year)
    return validate_movie_list(data)


@router.get("/users")
@handle_errors
async def serve_users_GET(request: Request):
    if parser.has_flag(request, "myData"):
        userId = parser.get_active_user_id(request)
        data = qu.get_my_user_data(userId)
        return validate_my_user_data(data)
    else:
        return validate_user_list(qu.get_users())


@router.post("/users")
# * (POST means add a new user)
@handle_errors
async def serve_users_POST(request: Request):
    # * Expects a body with a username field
    # * Any other fields in body will be added to the user
    body = await request.json()
    if body is None:
        raise APIArgumentError(
            "No body provided, what am I supposed to update?",
            [("body", "literally anything")],
        )
    username = body.get("username")
    newUserReturn = mu.add_user(username)
    newUserId, code = validate_user_id(newUserReturn)
    if code != 0:
        logging.error(
            f"Tried to add a new user, but somehow mu.add_user() returned an invalid user id <{newUserReturn}>."
        )
        raise HTTPException(
            status_code=500, detail="Ambiguous success state from user creation process"
        )
    UserSession.session_added_user()
    mu.update_user(newUserId, body)
    newState = qu.get_users()
    newState = validate_user_list(newState)
    return {"userId": newUserId, "users": newState}


@router.put("/users")
# * (PUT means update a user's info)
@handle_errors
async def serve_users_PUT(request: Request):
    # * Expects any dictionary of user data
    userId = parser.get_active_user_id(request)
    body = await request.json()
    if body is None:
        raise APIArgumentError("No body provided", [("anythng json-y", "body")])
    mu.update_user(userId, body)
    newState = qu.get_my_user_data(userId)
    newState = validate_my_user_data(newState)
    return newState


@router.delete("/users")
@handle_errors
async def serve_users_DELETE(request: Request):
    body = await request.json()
    if body is None:
        raise APIArgumentError("No body provided", [("anythng json-y", "body")])
    cookie_id = parser.get_active_user_id(request)
    param_id = request.query_params.get("userId")
    body_id = body.get("userId")
    if not (body.get("forRealsies") and body.get("delete")):
        raise APIArgumentError(
            "Must confirm user deletion", [("forRealsies", "body"), ("delete", "body")]
        )
    if not (cookie_id == param_id and cookie_id == body_id):
        raise APIArgumentError(
            "Need matching ids in cookie, param, and body",
            [("activeUserId", "cookie"), ("userId", "param"), ("userId", "body")],
        )
    real_id = cookie_id
    mu.delete_user(real_id)
    return validate_user_list(qu.get_users())


@router.get("/categories")
@handle_errors
async def serve_categories():
    return validate_category_list(qu.get_categories())


# Expect justMe = bool
# If PUT, expect movieId and status
@router.get("/watchlist")
@handle_errors
async def serve_watchlist_GET(request: Request):
    year = parser.get_year(request)
    justMe = parser.has_flag(request, "justMe")
    if justMe:
        userId = parser.get_active_user_id(request)
        data = qu.get_watchlist(year)
        data = [row for row in data if row["userId"] == userId]
        return validate_watchlist(data)
    else:
        return validate_watchlist(qu.get_watchlist(year))


@router.put("/watchlist")
@handle_errors
async def serve_watchlist_PUT(request: Request):
    userId = parser.get_active_user_id(request)
    body = await request.json()
    if body is None:
        raise APIArgumentError("No body provided", [("anythng json-y", "body")])
    year = parser.get_year(request, body=True)
    movieIds = body.get("movieIds")
    status = body.get("status")
    for movieId in movieIds:
        validMovieId, code = validate_movie_id(movieId)
        if code != 0:
            raise APIArgumentError(
                f"Invalid movie id: {movieId}", [("movieIds", "body")]
            )
        validStatus, code = validate_watchstatus(status)
        if code != 0:
            raise APIArgumentError(f"Invalid status: {status}", [("status", "body")])
        mu.add_watchlist_entry(year, userId, validMovieId, validStatus)
    return validate_watchlist(qu.get_watchlist(year))


@router.get("/by_user")
@handle_errors
async def serve_by_user(request: Request):
    year = parser.get_year(request)
    data = qu.get_user_stats(year)
    return validate_user_stats_list(data)


@router.get("/by_category")
@handle_errors
async def serve_by_category(request: Request):
    year = parser.get_year(request)
    data = qu.get_category_completion_dict(year)
    return validate_category_completion_dict(data)


if __name__ == "__main__":
    raise Exception("This is not a standalone script")
