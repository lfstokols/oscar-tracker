from flask import Blueprint, send_from_directory, request, jsonify, abort

# from flask_cors import CORS
import os
from pathlib import Path
from backend.logic.utils import catch_file_locked_error, no_year_response
from logic.StorageManager import StorageManager
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
    return catch_file_locked_error(storage.get_movies, year, json=True)


@oscars.route("/api/users", methods=["GET", "POST", "PUT", "DELETE"])
def get_users():
    userId = request.cookies.get("userId")
    if request.method == "GET":
        return catch_file_locked_error(storage.json_read, "u")
    elif request.method == "POST":
        # Expects a username, possibly a letterboxd and/or email
        username = request.json.get("username")
        return catch_file_locked_error(storage.add_user, username)
    elif request.method == "PUT":
        # Expects any dictionary of user data
        storage.update_user(userId, request.json)
        return
    elif request.method == "DELETE":
        storage.delete_user(userId)
        return


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
        if storage.add_watchlist_entry(year, userId, movieId, status):
            print("add_watchlist said True")
        else:
            print("add_watchlist said False")
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
