import logging
import os
import sys
from pathlib import Path

# * Add the project root to the system path
project_root_directory = Path(__file__).parent.parent
sys.path.append(str(project_root_directory))
# * Setup logging
from backend.utils.logging_config import setup_logging

# * Set up StorageManager
from datetime import datetime, timedelta
from backend.data_management.api_validators import AnnotatedValidator
from backend.logic.storage_manager import StorageManager

StorageManager.make_storage(project_root_directory / "backend" / "database")

from backend.routing_lib.user_session import (
    start_new_session,
    log_session_activity,
    SessionArgs,
)

# * The rest of the imports
from backend.scheduled_tasks.scheduling import Config
from flask import Flask, request, send_from_directory, abort, session
from flask_apscheduler import APScheduler
from backend.database_routes import oscars
from flask_cors import CORS
from dotenv import load_dotenv
from backend.scheduled_tasks.check_rss import update_user_watchlist


load_dotenv(project_root_directory / ".env")
try:
    RUN_DEBUG = (os.getenv("RUN_DEBUG") or "").lower() == "true"
    DEVSERVER_PORT = int(os.getenv("DEVSERVER_PORT"))  # type: ignore
    OSCARS_ROUTE_BASENAME = os.getenv("OSCARS_ROUTE_BASENAME")
    SECRET_KEY = os.getenv("FLASK_SECRET_KEY")
    if not SECRET_KEY:
        raise ValueError("FLASK_SECRET_KEY must be set in .env file")
    logging.info(f"The port should be {DEVSERVER_PORT}.")
except Exception as e:
    logging.error(f"The .env file is missing or has an error: {e}")
    raise

log_dir = project_root_directory / "logs"
setup_logging(log_dir)

presumptive_static_folder = project_root_directory / "dist"
if not presumptive_static_folder.exists():
    raise FileNotFoundError(
        f"The static folder {presumptive_static_folder} does not exist."
    )

app = Flask(__name__, static_folder=presumptive_static_folder)
app.secret_key = SECRET_KEY

app.url_map.strict_slashes = False

app.config.from_object(Config())

scheduler = APScheduler()
scheduler.init_app(app)
scheduler.start()

# CORS(
#     app,
#     origins=[
#     ],
#     methods=["GET", "POST", "PUT", "OPTIONS"],
# )

app.register_blueprint(oscars, url_prefix="/api/")


@app.route("/")
def serve_root():
    return send_from_directory(app.static_folder, "index.html")  # type: ignore


@app.route("/<path:relpath>")
def serve_files(relpath):
    if app.static_folder is None:
        return abort(404)
    filepath = Path(app.static_folder) / relpath
    if not filepath.is_relative_to(app.static_folder):
        return abort(403)
    if filepath.exists():
        return send_from_directory(filepath.parent, filepath.name)
    if (filepath / "index.html").exists():
        return send_from_directory(filepath, "index.html")
    return send_from_directory(Path(app.static_folder), "index.html")


@app.route("/jokes")
def serve_joke():
    return "<h1>It's a joke!</h1>"


@app.route("/force-refresh")
def force_refresh():
    logging.debug("got a force refresh")
    try:
        user_id = AnnotatedValidator(user=session.get("activeUserId")).user
        assert user_id is not None
        update_user_watchlist(user_id)
        return "bsnsns", 200
    except Exception as e:
        return abort(400)


@app.route("/favicon.ico")
def favicon():
    return send_from_directory(
        "../public", "favicon.ico", mimetype="image/vnd.microsoft.icon"
    )


@app.before_request
def before_request():
    login = request.cookies.get("activeUserId")
    if login is None:
        return
    try:
        assert AnnotatedValidator(user=login)
    except Exception as e:
        logging.error(f"Invalid user id {e} found in cookie.")
        login = None
        session[SessionArgs.user_id.value] = None
        session[SessionArgs.last_activity.value] = None

    if login and session.get("session_token") != login:
        start_new_session(login)

    if login and datetime.now() - session.get(
        "last_activity", datetime.min
    ) > timedelta(minutes=20):
        update_user_watchlist(login)
        log_session_activity()


if __name__ == "__main__":
    app.run(debug=RUN_DEBUG, port=DEVSERVER_PORT)
