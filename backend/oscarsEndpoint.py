import time
from dotenv import load_dotenv
from functools import wraps
from flask import Blueprint, send_from_directory, request, jsonify, abort

# from flask_cors import CORS
import os
from pathlib import Path

from nbformat import ValidationError
import requests
from backend.data_management.validators import validate_nom_list
from backend.logic import utils
from backend.logic.utils import (
    catch_file_locked_error,
    no_year_response,
    has_flag,
    YearError,
)
from logic.StorageManager import StorageManager
import backend.logic.Processing as pr
import backend.logic.Mutations as mu
from logic.MyTypes import *

# from data_management.schemas import *
from data_management.validators import *

load_dotenv(Path(__file__).parent.parent / ".env")
try:
    PYDANTIC_ERROR_STATUS_CODE = int(os.getenv("PYDANTIC_ERROR_STATUS_CODE"))
except Exception as e:
    print(f"The .env file is missing or has an error: {e}")
    raise

project_root_directory = Path(__file__).parent.parent
storage = StorageManager(project_root_directory / "backend" / "database")

oscars = Blueprint(
    "oscars",
    __name__,
    static_folder=project_root_directory / "dist",
    static_url_path="/oscars/",
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
        except YearError as e:
            print(f"YearError: {e}")
            return no_year_response()
        except Exception as e:
            print(f"Identifiable string <892734> at {func.__name__}({args}, {kwargs})")
            print(f"Error of type {type(e)} with message {e}")
            raise

    return wrapper


# Serve data
@oscars.route("/api/nominations", methods=["GET"])
@handle_errors
def serve_noms():
    if not (year := request.args.get("year")):
        raise YearError()

    data = storage.read("n", year)
    return validate_nom_list(data)


@oscars.route("/api/movies", methods=["GET"])
@handle_errors
def serve_movies():
    if not (year := request.args.get("year")):
        raise YearError()
    data = pr.get_movies(storage, year)
    return validate_movie_list(data)


@oscars.route("/api/users", methods=["GET", "POST", "PUT", "DELETE"])
@handle_errors
def serve_users():
    userId = utils.get_active_user_id(storage, request)
    if request.method == "GET":
        if has_flag(request, "myData") and userId:
            data = pr.get_my_user_data(storage, userId)
            return validate_my_user_data(data)
        if has_flag(request, "completionData"):
            year = request.args.get("year", None)
            if year is None:
                raise YearError()
            data = pr.get_user_completion_data(storage, year=year)
            return validate_user_stats_list(data)
        return validate_user_list(pr.get_users(storage))
    elif request.method == "POST":
        # * Expects a body with a username field
        # * Any other fields in body will be added to the user
        username = request.json.get("username")
        newUserId = mu.add_user(storage, username)
        newUserId = UserID(newUserId)
        mu.update_user(storage, newUserId, request.json)
        newState = pr.get_users(storage, json=True)
        newState = validate_user_list(newState)
        return jsonify({"userId": newUserId, "users": newState})
    elif request.method == "PUT":
        # * Expects any dictionary of user data
        mu.update_user(storage, userId, request.json)
        newState = pr.get_my_user_data(storage, userId, json=True)
        return jsonify(newState)
    elif request.method == "DELETE":
        cookie_id = request.cookies.get("activeUserId")
        param_id = request.args.get("userId")
        body_id = request.json.get("userId")
        if not (request.json.get("forRealsies") and request.json.get("delete")):
            print(
                "Tried to delete user without 'delete: true' and 'forRealsies: true' in body"
            )
            return jsonify({"error": "Must confirm deletion"}), 400
        if not (cookie_id == param_id and cookie_id == body_id):
            print("Tried to delete user with mismatching ids")
            return jsonify({"error": "Mismatching ids"}), 400
        mu.delete_user(storage, userId)
        newState = pr.get_users(storage, json=True)
        return jsonify({"users": newState})


@oscars.route("/api/categories", methods=["GET"])
@handle_errors
def serve_categories():
    return catch_file_locked_error(storage.json_read, "c")


# Expect justMe = bool
# If PUT, expect movieId and status
@oscars.route("/api/watchlist", methods=["GET", "PUT"])
@handle_errors
def serve_watchlist():
    userId = utils.get_active_user_id(storage, request)
    if request.method == "GET":
        justMe = (
            x.lower() == "true"
            if ((x := request.args.get("justMe")) != None)
            else False
        )
        if userId is None:
            userId = request.args.get("userId")
        if not (year := request.args.get("year")):
            print("No year provided")
            return no_year_response()
        if justMe:
            # TODO - Add locked file error handling
            data = storage.read("w", year)
            return jsonify(data.loc[data["userId"] == userId].to_dict(orient="records"))
        else:
            return catch_file_locked_error(storage.json_read, "w", year)
    elif request.method == "PUT":
        movieId = request.json.get("movieId")
        status = request.json.get("status")
        if not (year := request.json.get("year")):
            print("No year provided")
            return no_year_response()
        storage.add_watchlist_entry(year, userId, movieId, status)
        return jsonify(storage.json_read("w", year))
        # TODO - Figure out a pattern for file lock errors with PUT requests


@oscars.route("/api/letterboxd/search", methods=["GET"])
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


# Serve React App
@oscars.route("/")
def serve_root():
    return send_from_directory(oscars.static_folder, "index.html")


@oscars.route("/favicon<path:_>")
def serve_favicon(_):
    return send_from_directory("../public", "favicon.ico")


@oscars.route("/<path:relpath>")
def serve(relpath):
    filepath = Path(oscars.static_folder) / relpath
    if not filepath.is_relative_to(oscars.static_folder):
        return abort(403)
    if filepath.exists():
        return send_from_directory(filepath.parent, filepath.name)


if __name__ == "__main__":
    oscars.run(debug=True)
