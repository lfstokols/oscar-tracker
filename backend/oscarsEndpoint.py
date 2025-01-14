from flask import Blueprint, send_from_directory, request, jsonify, abort

# from flask_cors import CORS
import os
from pathlib import Path
from backend.logic.utils import catch_file_locked_error, no_year_response, has_flag
from logic.StorageManager import StorageManager
import backend.logic.Processing as pr
import backend.logic.Mutations as mu
from logic.MyTypes import *

storage = StorageManager(os.path.join(os.path.dirname(__file__), "database"))

oscars = Blueprint(
    "oscars", __name__, static_folder="../dist/", static_url_path="/oscars/"
)
# CORS(oscars)  # Enable CORS for all routes


# TEST_DATA = '{ "users": [{ "username": "Logan", "watchedMovies": ["Oppenheimer"] }], "movies": [ { "title": "Oppenheimer", "nominations": [ "Best Picture", "Actor", "Actress" ] }, { "title": "Poor Things", "nominations": [ "Best Picture", "Actor", "Actress" ] }, { "title": "Killers of the Flower Moon", "nominations": [ "Best Picture", "Actor", "Actress" ] }, { "title": "Barbie", "nominations": [ "Best Picture", "Actor", "Actress" ] } ] }'


# Serve data
@oscars.route("/api/nominations", methods=["GET"])
def get_noms():
    if not (year := request.args.get("year")):
        print("No year provided")
        return no_year_response()

    return catch_file_locked_error(storage.json_read, "n", year)


@oscars.route("/api/movies", methods=["GET"])
def get_movies():
    if not (year := request.args.get("year")):
        print("No year provided")
        return no_year_response()
    return catch_file_locked_error(pr.get_movies, storage, year, json=True)


@oscars.route("/api/users", methods=["GET", "POST", "PUT", "DELETE"])
def get_users():
    userId = request.cookies.get("userId", None)
    if request.method == "GET":
        if has_flag(request, "myData") and userId:
            print("has_flag(myData) and has userId", userId)
            return catch_file_locked_error(
                pr.get_my_user_data, storage, userId, json=True
            )
        if has_flag(request, "completionData"):
            year = request.args.get("year", None)
            if year is None:
                return no_year_response()
            return catch_file_locked_error(pr.get_user_completion_data, storage, year=year, json=True)
        return catch_file_locked_error(pr.get_users, storage, json=True)
    elif request.method == "POST":
        # Expects a body with a username field
        # Any other fields in body will be added to the user
        username = request.json.get("username")
        output, status = catch_file_locked_error(mu.add_user, storage, username)
        if status != 200:
            return output, status
        newUserId = output
        mu.update_user(storage, newUserId, request.json)
        newState = pr.get_users(storage, json=True)
        return jsonify({"userId": newUserId, "users": newState})
    elif request.method == "PUT":
        # Expects any dictionary of user data
        mu.update_user(storage, userId, request.json)
        newState = pr.get_my_user_data(storage, userId, json=True)
        return jsonify({"userId": userId, "users": newState})
    elif request.method == "DELETE":
        mu.delete_user(storage, userId)
        newState = pr.get_users(storage, json=True)
        return jsonify({"users": newState})


@oscars.route("/api/categories", methods=["GET"])
def get_categories():
    return catch_file_locked_error(storage.json_read, "c")


# Expect justMe = bool
# If PUT, expect movieId and status
@oscars.route("/api/watchlist", methods=["GET", "PUT"])
def get_watchlist():
    if "activeUserId" in request.cookies:
        userId = request.cookies.get("activeUserId")
    else:
        userId = None
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
