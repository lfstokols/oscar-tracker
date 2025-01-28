import os, logging
from datetime import datetime
import time
from functools import wraps
from flask import Blueprint, send_from_directory, request, jsonify, abort
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
)
from backend.routing_lib.user_session import session_added_user

# from backend.logic.storage_manager import StorageManager
import backend.logic.Processing as pr
from backend.scheduled_tasks.check_rss import (
    get_movie_list_from_rss,
)

#! vvv this is dumb vvv
from backend.routing_lib import utils
from backend.routing_lib.utils import (
    has_flag,
    YearError,
    MissingAPIArgumentError,
)


# try:
#     storage = StorageManager.get_storage()
# except Exception as e:
#     logging.error(f"Must create storage before importing database_routes.py")
#     raise

static_folder = env.STATIC_PATH
if not static_folder.exists():
    raise FileNotFoundError(f"The static folder {static_folder} does not exist.")
oscars = Blueprint(
    "oscars",
    __name__,
    static_folder=static_folder,
    static_url_path="/api/",
)


def handle_errors(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except OSError as e:
            if e.errno == 13:
                logging.warning(
                    f"Locked file [Errno 13]: {func.__name__}({args}, {kwargs}) failed at {time.time()}"
                )
                return {
                    "error": "File is locked, please try again later",
                    "retryable": "true",
                }, 423
            raise
        except ValidationError as e:
            logging.warning(f"Pydantic validation failed: {e.errors()}")
            return (
                jsonify({"error": "Pydantic validation failed", "message": str(e)}),
                env.PYDANTIC_ERROR_STATUS_CODE,
            )
        except MissingAPIArgumentError as e:
            logging.warning(
                f"MissingAPIArgumentError: {e.message}",
                f"Missing data: {e.missing_data}",
            )
            return jsonify({"error": e.message, "missing_data": e.missing_data}), 422
        except Exception as e:
            logging.error(
                f"Identifiable string <892734> at {func.__name__}({args}, {kwargs})"
            )
            logging.error(f"Error of type {type(e)} with message {e}")
            raise

    return wrapper


# Serve data
@oscars.route("/nominations", methods=["GET"])
@handle_errors
def serve_noms():
    if not (year := request.args.get("year")):
        raise YearError()
    try:
        year = int(year)
    except ValueError:
        raise ValueError("Year must be an integer")
    data = qu.get_noms(year)
    return validate_nom_list(data)


@oscars.route("/movies", methods=["GET"])
@handle_errors
def serve_movies():
    if not (year := request.args.get("year")):
        raise YearError("query params")
    data = qu.get_movies(year)
    return validate_movie_list(data)


@oscars.route("/users", methods=["GET"])
@handle_errors
def serve_users_GET():
    userId = utils.get_active_user_id(request)
    if has_flag(request, "myData") and userId:
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
    AnnotatedValidator(user=newUserId)
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
        raise MissingAPIArgumentError("No active user id", [("activeUserId", "cookie")])
    if request.json is None:
        raise MissingAPIArgumentError("No body provided", [("anythng json-y", "body")])
    mu.update_user(userId, request.json)
    newState = qu.get_my_user_data(userId)
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
    mu.delete_user(body_id)
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
    if not (year := request.args.get("year")):
        raise YearError()
    try:
        year = int(year)
    except ValueError:
        raise ValueError("Year must be an integer")
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
        raise MissingAPIArgumentError("No body provided", [("anythng json-y", "body")])
    if not (year := request.json.get("year")):
        raise YearError()
    try:
        year = int(year)
    except ValueError:
        raise ValueError("Year must be an integer")
    if userId is None:
        raise MissingAPIArgumentError("No active user id", [("activeUserId", "cookie")])
    movieIds = request.json.get("movieIds")
    status = request.json.get("status")
    for movieId in movieIds:
        mu.add_watchlist_entry(year, userId, movieId, status)
    return validate_watchlist(qu.get_watchlist(year))


@oscars.route("/by_user", methods=["GET"])
@handle_errors
def serve_by_user():
    year = request.args.get("year")
    if year is None:
        raise YearError()
    try:
        year = int(year)
    except ValueError:
        raise ValueError("Year must be an integer")
    data = qu.get_user_stats(year)
    return validate_user_stats_list(data)


@oscars.route("/by_category", methods=["GET"])
@handle_errors
def serve_by_category():
    year = request.args.get("year")
    if year is None:
        raise YearError()
    try:
        year = int(year)
    except ValueError:
        raise ValueError("Year must be an integer")
    data = qu.get_category_completion_dict(year)
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
    user_id = AnnotatedValidator(user=utils.get_active_user_id(request)).user
    assert user_id is not None
    movie_list = get_movie_list_from_rss(user_id, year=datetime.now().year - 1)
    for movie_id in movie_list:
        logging.debug(f"Got {movie_id} from {user_id}'s letterboxd.")
        mu.add_watchlist_entry(
            year=datetime.now().year - 1,
            userId=user_id,
            movieId=movie_id,
            status=WatchStatus_pyd.SEEN,
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
