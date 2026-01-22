import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException, Request

import backend.data.mutations as mu
import backend.data.queries as qu
import backend.routing_lib.request_parser as parser
from backend.intake.router import router as intake_router
from backend.routes.admin_routes import router as admin_router
from backend.routes.forwarding import router as forwarding_router
from backend.routes.hooks import router as hooks_router
from backend.routing_lib.error_handling import APIArgumentError
from backend.routing_lib.user_session import UserSession
from backend.types.api_schemas import (
    CategoryCompletionKey,
    Primitive,
    UserID,
    api_Category,
    api_CategoryCompletions,
    api_Movie,
    api_MyUserData,
    api_NewUserResponse,
    api_NewWatchlistRequest,
    api_NextKeyDate,
    api_Nom,
    api_User,
    api_UserStats,
    api_WatchNotice,
    countTypes,
)
from backend.types.api_validators import validate_user_id
from backend.types.my_types import *

router = APIRouter()

router.include_router(admin_router, prefix="/admin")
router.include_router(intake_router, prefix="/admin/intake")
router.include_router(forwarding_router, prefix="/forward")
router.include_router(hooks_router, prefix="/hooks")


# Serve data
@router.get("/years", response_model=list[int])
async def serve_years() -> list[int]:
    return qu.get_years()


@router.get("/years/default", response_model=int)
async def serve_default_year() -> int:
    available_years = qu.get_years()
    return max(available_years)


@router.get("/nominations", response_model=list[api_Nom])
async def serve_noms(year: parser.ActiveYear) -> list[dict[str, Primitive]]:
    return qu.get_noms(year)


@router.get("/movies", response_model=list[api_Movie])
async def serve_movies(
    year: parser.ActiveYear,
) -> list[api_Movie]:
    movies = qu.get_movies(year)
    return [api_Movie.model_validate(m) for m in movies]


@router.get("/users", response_model=list[api_User])
async def serve_users_GET() -> list[dict[str, Primitive]]:
    return qu.get_users()


@router.get("/users/my_data", response_model=api_MyUserData)
async def serve_my_user_data(userId: parser.ActiveUserID) -> dict[str, Primitive]:
    return await qu.get_my_user_data(userId)


@router.get("/users/profile", response_model=api_User)
async def serve_user_profile(userId: str) -> dict[str, Primitive]:
    """Get public profile data (including profile picture) for any user."""
    validated_id, code = validate_user_id(userId)
    if code != 0:
        raise APIArgumentError("Invalid user id", [("userId", "query params")])
    return await qu.get_user_profile(validated_id)


@router.post("/users", response_model=api_NewUserResponse)
# * (POST means add a new user)
async def serve_users_POST(
    request: Request,
) -> dict[str, str | list[dict[str, Primitive]]]:
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
    UserSession(request).session_added_user()
    mu.update_user(newUserId, body)
    newState = qu.get_users()
    return {"userId": newUserId, "users": newState}


@router.put("/users", response_model=api_MyUserData)
# * (PUT means update a user's info)
async def serve_users_PUT(
    userId: parser.ActiveUserID, body: api_MyUserData
) -> dict[str, Primitive]:
    # * Expects any dictionary of user data
    mu.update_user(userId, body.model_dump())
    newState = await qu.get_my_user_data(userId)
    return newState


@router.delete("/users", response_model=list[api_User])
async def serve_users_DELETE(request: Request) -> list[dict[str, Primitive]]:
    body = await request.json()
    if body is None:
        raise APIArgumentError("No body provided", [
                               ("anythng json-y", "body")])
    cookie_id = parser.get_active_user_id(request)
    param_id = request.query_params.get("userId")
    body_id = body.get("userId")
    if not (body.get("forRealsies") and body.get("delete")):
        raise APIArgumentError(
            "Must confirm user deletion", [
                ("forRealsies", "body"), ("delete", "body")]
        )
    if not (cookie_id == param_id and cookie_id == body_id):
        raise APIArgumentError(
            "Need matching ids in cookie, param, and body",
            [("activeUserId", "cookie"), ("userId", "param"), ("userId", "body")],
        )
    real_id = cookie_id
    mu.delete_user(real_id)
    return qu.get_users()


@router.get("/categories", response_model=list[api_Category])
async def serve_categories() -> list[dict[str, Primitive]]:
    return qu.get_categories()


# Expect justMe = bool
# If PUT, expect movieId and status
@router.get("/watchlist", response_model=list[api_WatchNotice])
async def serve_watchlist_GET(
    request: Request, year: parser.ActiveYear, justMe: bool = False
):
    if justMe:
        userId = parser.get_active_user_id(request)
        data = qu.get_watchlist(year)
        data = [row for row in data if row["userId"] == userId]
        return data
    else:
        return qu.get_watchlist(year)


@router.put("/watchlist", response_model=list[api_WatchNotice])
async def serve_watchlist_PUT(
    userId: parser.ActiveUserID, year: parser.BodyYear, body: api_NewWatchlistRequest
):
    status = body.status
    for movieId in body.movieIds:
        mu.add_watchlist_entry(year, userId, movieId, status)
    return qu.get_watchlist(year)


@router.get("/by_user", response_model=list[api_UserStats])
async def serve_by_user(year: parser.ActiveYear) -> list[dict[str, Primitive]]:
    return qu.get_user_stats(year)


@router.get("/by_category", response_model=dict[UserID, api_CategoryCompletions])
async def serve_by_category(
    year: parser.ActiveYear,
) -> dict[UserID, dict[CategoryCompletionKey, dict[countTypes, int]]]:
    return qu.get_category_completion_dict(year)


@router.post("/log-error")
async def log_frontend_error(request: Request):
    body = await request.json()
    logging.error(f"[FRONTEND] {body}")
    return {"ok": True}


@router.get("/next_key_date")
async def serve_next_key_date() -> api_NextKeyDate | None:
    key_dates = qu.get_key_dates()
    key_dates = sorted(list(key_dates), key=lambda x: x[0])
    next_date, next_description = None, None
    for date, description in key_dates:
        if date > datetime.now():
            next_date = date
            next_description = description
            break
    if next_date is None:
        return None
    return api_NextKeyDate(timestamp=next_date, description=next_description)


if __name__ == "__main__":
    raise Exception("This is not a standalone script")
