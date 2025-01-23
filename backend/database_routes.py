from datetime import datetime
import time
from dotenv import load_dotenv
from functools import wraps
from flask import Blueprint, send_from_directory, request, jsonify, abort

# from flask_cors import CORS
import os
from pathlib import Path
from flask import session
from pydantic import ValidationError
import requests
from backend.routing_lib.user_session import SessionArgs, session_added_user
from backend.scheduled_tasks.check_rss import update_user_watchlist, get_movie_list_from_rss
from backend.types.api_schemas import UserID
from backend.data_management.api_validators import (
    validate_nom_list,
    validate_movie_list,
    validate_user_list,
    validate_watchlist,
    validate_category_list,
    validate_my_user_data,
    validate_category_completion_dict,
    validate_user_stats_list,
    AnnotatedValidator,
)
from backend.routing_lib import utils
from backend.routing_lib.utils import (
    has_flag,
    YearError,
    MissingAPIArgumentError,
)
from backend.logic.storage_manager import StorageManager
import backend.logic.Processing as pr
import backend.logic.Mutations as mu
from backend.types.my_types import *

project_root_directory = Path(__file__).parent.parent
load_dotenv(project_root_directory / ".env")
try:
    PYDANTIC_ERROR_STATUS_CODE = int(os.getenv("PYDANTIC_ERROR_STATUS_CODE") or "500")
except Exception as e:
    print(f"The .env file is missing or has an error: {e}")
    raise

storage = StorageManager.get_storage()
if not Path.exists(project_root_directory / "dist"):
    raise FileNotFoundError("The dist folder is missing")
oscars = Blueprint(
    "oscars",
    __name__,
    static_folder=project_root_directory / "dist",
    static_url_path="/api/",
)
# CORS(oscars)  # Enable CORS for all routes


def handle_errors(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
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
        except ValidationError as e:
            print(f"Pydantic validation failed: {e.errors()}")
            return (
                jsonify({"error": "Pydantic validation failed", "message": str(e)}),
                PYDANTIC_ERROR_STATUS_CODE,
            )
        except MissingAPIArgumentError as e:
            print(
                f"MissingAPIArgumentError: {e.message}",
                f"Missing data: {e.missing_data}",
            )
            return jsonify({"error": e.message, "missing_data": e.missing_data}), 422
        except Exception as e:
            print(f"Identifiable string <892734> at {func.__name__}({args}, {kwargs})")
            print(f"Error of type {type(e)} with message {e}")
            raise

    return wrapper


# Serve data
@oscars.route("/nominations", methods=["GET"])
@handle_errors
def serve_noms():
    if not (year := request.args.get("year")):
        raise YearError()

    data = storage.read("nominations", year)
    return validate_nom_list(data)


@oscars.route("/movies", methods=["GET"])
@handle_errors
def serve_movies():
    if not (year := request.args.get("year")):
        raise YearError("query params")
    data = pr.get_movies(storage, year)
    return validate_movie_list(data)


@oscars.route("/users", methods=["GET"])
@handle_errors
def serve_users_GET():
    userId = utils.get_active_user_id(storage, request)
    if has_flag(request, "myData") and userId:
        data = pr.get_my_user_data(storage, userId)
        return validate_my_user_data(data)
    # elif has_flag(request, "categoryCompletionData"):
    #     year = request.args.get("year", None)
    #     if year is None:
    #         raise YearError("query params")
    #     #! should this be here?
    #     data = pr.get_category_completion_data(storage, year=year)
    #     return validate_category_completion_dict(data)
    else:
        return validate_user_list(pr.get_users(storage))


@oscars.route("/users", methods=["POST"])
@handle_errors
def serve_users_POST():
    # * Expects a body with a username field
    # * Any other fields in body will be added to the user
    if request.json is None:
        raise ValueError("No body provided, what am I supposed to update?")
    username = request.json.get("username")
    newUserId: UserID = mu.add_user(storage, username)
    AnnotatedValidator(user=newUserId)
    session_added_user()
    mu.update_user(storage, newUserId, request.json)
    newState = pr.get_users(storage)
    newState = validate_user_list(newState)
    return jsonify({"userId": newUserId, "users": newState})


@oscars.route("/users", methods=["PUT"])
@handle_errors
def serve_users_PUT():
    # * Expects any dictionary of user data
    userId = utils.get_active_user_id(storage, request)
    if userId is None:
        raise MissingAPIArgumentError("No active user id", [("activeUserId", "cookie")])
    if request.json is None:
        raise MissingAPIArgumentError("No body provided", [("anythng json-y", "body")])
    mu.update_user(storage, userId, request.json)
    newState = pr.get_my_user_data(storage, userId)
    newState = validate_my_user_data(newState)
    return jsonify(newState)


@oscars.route("/users", methods=["DELETE"])
@handle_errors
def serve_users_DELETE():
    if request.json is None:
        raise MissingAPIArgumentError("No body provided", [("anythng json-y", "body")])
    cookie_id = request.cookies.get("activeUserId")
    param_id = request.args.get("userId")
    body_id: UserID = request.json.get("userId")
    if not (request.json.get("forRealsies") and request.json.get("delete")):
        raise MissingAPIArgumentError(
            "Must confirm user deletion", [("forRealsies", "body"), ("delete", "body")]
        )
    if not (cookie_id == param_id and cookie_id == body_id):
        raise MissingAPIArgumentError(
            "Need matching ids in cookie, param, and body",
            [("activeUserId", "cookie"), ("userId", "param"), ("userId", "body")],
        )
    AnnotatedValidator(user=body_id)
    mu.delete_user(storage, body_id)
    return validate_user_list(pr.get_users(storage))


@oscars.route("/categories", methods=["GET"])
@handle_errors
def serve_categories():
    return validate_category_list(storage.read("categories"))


# Expect justMe = bool
# If PUT, expect movieId and status
@oscars.route("/watchlist", methods=["GET"])
@handle_errors
def serve_watchlist_GET():
    userId = utils.get_active_user_id(storage, request)
    justMe = (
        x.lower() == "true" if ((x := request.args.get("justMe")) != None) else False
    )
    if not (year := request.args.get("year")):
        raise YearError()
    if justMe:
        data = storage.read("watchlist", year)
        data = data.loc[data[WatchlistColumns.USER.value] == userId]
        return validate_watchlist(data)
    else:
        return validate_watchlist(storage.read("watchlist", year))


@oscars.route("/watchlist", methods=["PUT"])
@handle_errors
def serve_watchlist_PUT():
    userId = utils.get_active_user_id(storage, request)
    if request.json is None:
        raise MissingAPIArgumentError("No body provided", [("anythng json-y", "body")])
    if not (year := request.json.get("year")):
        raise YearError()
    movieIds = request.json.get("movieIds")
    status = request.json.get("status")
    for movieId in movieIds:
        mu.add_watchlist_entry(storage, year, userId, movieId, status)
    return validate_watchlist(storage.read("watchlist", year))


@oscars.route("/by_user", methods=["GET"])
@handle_errors
def serve_by_user():
    year = request.args.get("year")
    if year is None:
        raise YearError()
    data = pr.get_user_stats(storage, year)
    return validate_user_stats_list(data)


@oscars.route("/by_category", methods=["GET"])
@handle_errors
def serve_by_category():
    year = request.args.get("year")
    if year is None:
        raise YearError()
    data = pr.get_category_completion_dict(storage, year)
    return validate_category_completion_dict(data)


@oscars.route("/letterboxd/search", methods=["GET"])
@handle_errors
def serve_letterboxd_search():
    """
    Just a proxy for letterboxd.com search
    The search term is passed as a query parameter,
    and the results from letterboxd.com/s/search/members/<search_term>
    are returned.
    The results come in as html and are returned as html.
    """
    search_term = request.args.get("searchTerm")
    url = f"https://letterboxd.com/s/search/members/{search_term}"
    response = requests.get(url)
    return response.text


@oscars.route("/force-refresh", methods=["GET"])
def force_refresh():
    print("got a force refresh")
    # try:
    user_id = AnnotatedValidator(user=utils.get_active_user_id(storage, request)).user
    assert user_id is not None
    movie_list = get_movie_list_from_rss(user_id, year=datetime.now().year - 1)
    for movie_id in movie_list:
        mu.add_watchlist_entry(
            storage,
            year=datetime.now().year - 1,
            userId=user_id,
            movieId=movie_id,
            status=WatchStatus.SEEN,
        )
    return jsonify({"message": "Watchlist updated"}), 200
    # except Exception as e:
    #     return abort(400)


# Serve React App
@oscars.route("/")
def serve_root():
    if not oscars.static_folder:
        return abort(404)
    return send_from_directory(oscars.static_folder, "index.html")


@oscars.route("/favicon<path:_>")
def serve_favicon(_):
    return send_from_directory("../public", "favicon.ico")


@oscars.route("/<path:relpath>")
def serve(relpath):
    if not oscars.static_folder:
        return abort(404)
    filepath = Path(oscars.static_folder) / relpath
    if not filepath.is_relative_to(oscars.static_folder):
        return abort(403)
    if filepath.exists():
        return send_from_directory(filepath.parent, filepath.name)
    return abort(404)


if __name__ == "__main__":
    raise Exception("This is not a standalone script")
