import os, logging
from datetime import datetime
import time
from functools import wraps
from flask import Blueprint, send_from_directory, request, jsonify, abort, make_response
from pathlib import Path
from pydantic import ValidationError
import requests
import backend.utils.env_reader as env
import backend.data.queries as qu
import backend.data.mutations as mu
from backend.types.my_types import *
from backend.types.api_schemas import UserID, WatchStatus_pyd
from backend.types.api_validators import (
    validate_nom_list,
    validate_movie_list,
    validate_user_list,
    validate_watchlist,
    validate_category_list,
    validate_my_user_data,
    validate_category_completion_dict,
    validate_user_stats_list,
    AnnotatedValidator,
    UserValidator,
    MovieValidator,
    CategoryValidator,
    PosterPathValidator,
)
from backend.routing_lib.user_session import session_added_user

from backend.scheduled_tasks.check_rss import (
    get_movie_list_from_rss,
)
from backend.routes.forwarding import forwarding
from backend.routes.hooks import hooks

from backend.routing_lib import utils
from backend.routing_lib.utils import (
    has_flag,
    APIArgumentError,
    handle_errors,
)


oscars = Blueprint(
    "oscars",
    __name__,
    static_url_path="/api/",
)

oscars.register_blueprint(forwarding, url_prefix="/forward/")
oscars.register_blueprint(hooks, url_prefix="/hooks/")


# Serve data
@oscars.route("/nominations", methods=["GET"])
@handle_errors
def serve_noms():
    year = utils.get_year(request)
    data = qu.get_noms(year)
    return validate_nom_list(data)


@oscars.route("/movies", methods=["GET"])
@handle_errors
def serve_movies():
    year = utils.get_year(request)
    data = qu.get_movies(year)
    return validate_movie_list(data)


@oscars.route("/users", methods=["GET"])
@handle_errors
def serve_users_GET():
    userId = utils.get_active_user_id(request)
    if has_flag(request, "myData"):
        if userId is None:
            if request.cookies.get("activeUserId") is not None:
                response = make_response()
                response.delete_cookie("activeUserId")
                return response, 400
            raise APIArgumentError("No active user id", [("activeUserId", "cookie")])
        data = qu.get_my_user_data(userId)
        return jsonify(validate_my_user_data(data))
    else:
        return jsonify(validate_user_list(qu.get_users()))


@oscars.route("/users", methods=["POST"])
@handle_errors
def serve_users_POST():
    # * Expects a body with a username field
    # * Any other fields in body will be added to the user
    if request.json is None:
        raise ValueError("No body provided, what am I supposed to update?")
    username = request.json.get("username")
    newUserId: UserID = mu.add_user(username)
    newUserId = UserValidator(user=newUserId).user
    session_added_user()
    mu.update_user(newUserId, request.json)
    newState = qu.get_users()
    newState = validate_user_list(newState)
    return jsonify({"userId": newUserId, "users": newState})


@oscars.route("/users", methods=["PUT"])
@handle_errors
def serve_users_PUT():
    # * Expects any dictionary of user data
    userId = utils.get_active_user_id(request)
    if userId is None:
        raise APIArgumentError("No active user id", [("activeUserId", "cookie")])
    if request.json is None:
        raise APIArgumentError("No body provided", [("anythng json-y", "body")])
    mu.update_user(userId, request.json)
    newState = qu.get_my_user_data(userId)
    newState = validate_my_user_data(newState)
    return jsonify(newState)


@oscars.route("/users", methods=["DELETE"])
@handle_errors
def serve_users_DELETE():
    if request.json is None:
        raise APIArgumentError("No body provided", [("anythng json-y", "body")])
    cookie_id = request.cookies.get("activeUserId")
    param_id = request.args.get("userId")
    body_id: UserID = request.json.get("userId")
    if not (request.json.get("forRealsies") and request.json.get("delete")):
        raise APIArgumentError(
            "Must confirm user deletion", [("forRealsies", "body"), ("delete", "body")]
        )
    if not (cookie_id == param_id and cookie_id == body_id):
        raise APIArgumentError(
            "Need matching ids in cookie, param, and body",
            [("activeUserId", "cookie"), ("userId", "param"), ("userId", "body")],
        )
    real_id = UserValidator(user=body_id).user
    mu.delete_user(real_id)
    return validate_user_list(qu.get_users())


@oscars.route("/categories", methods=["GET"])
@handle_errors
def serve_categories():
    return validate_category_list(qu.get_categories())


# Expect justMe = bool
# If PUT, expect movieId and status
@oscars.route("/watchlist", methods=["GET"])
@handle_errors
def serve_watchlist_GET():
    userId = utils.get_active_user_id(request)
    justMe = (
        x.lower() == "true" if ((x := request.args.get("justMe")) != None) else False
    )
    year = utils.get_year(request)
    if justMe:
        data = qu.get_watchlist(year)
        data = [row for row in data if row["userId"] == userId]
        return validate_watchlist(data)
    else:
        return validate_watchlist(qu.get_watchlist(year))


@oscars.route("/watchlist", methods=["PUT"])
@handle_errors
def serve_watchlist_PUT():
    userId = utils.get_active_user_id(request)
    if request.json is None:
        raise APIArgumentError("No body provided", [("anythng json-y", "body")])
    year = utils.get_year(request, body=True)
    if userId is None:
        raise APIArgumentError("No active user id", [("activeUserId", "cookie")])
    movieIds = request.json.get("movieIds")
    status = request.json.get("status")
    for movieId in movieIds:
        mu.add_watchlist_entry(year, userId, movieId, status)
    return validate_watchlist(qu.get_watchlist(year))


@oscars.route("/by_user", methods=["GET"])
@handle_errors
def serve_by_user():
    year = utils.get_year(request)
    data = qu.get_user_stats(year)
    return validate_user_stats_list(data)


@oscars.route("/by_category", methods=["GET"])
@handle_errors
def serve_by_category():
    year = utils.get_year(request)
    data = qu.get_category_completion_dict(year)
    return validate_category_completion_dict(data)


if __name__ == "__main__":
    raise Exception("This is not a standalone script")
