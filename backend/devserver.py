import sys, os, logging
from pathlib import Path
from datetime import datetime, timedelta
from dotenv import load_dotenv
from flask import Flask, request, send_from_directory, abort, session
from flask_apscheduler import APScheduler

# * Add the project root to the system path
project_root_directory = Path(__file__).parent.parent
sys.path.append(str(project_root_directory))
os.environ["ROOT_DIR"] = str(project_root_directory)
import backend.utils.env_reader as env

# * Setup logging
from backend.utils.logging_config import setup_logging

setup_logging(env.LOG_PATH)
from backend.types.api_validators import UserValidator, AnnotatedValidator

# * Set up StorageManager
# from backend.logic.storage_manager import StorageManager

# StorageManager.make_storage(env.DATABASE_PATH)
# * The rest of the imports
from backend.routing_lib.user_session import (
    start_new_session,
    log_session_activity,
    SessionArgs,
)
from backend.scheduled_tasks.check_rss import update_user_watchlist
from backend.scheduled_tasks.scheduling import Config
import backend.data.db_connections
from backend.database_routes import oscars  #! must instantiate storage first

DEVSERVER_PORT = env.DEVSERVER_PORT  #! Gunicorn breaks without this!!!
logging.info(f"The port should be {DEVSERVER_PORT}.")


if not env.STATIC_PATH.exists():
    raise FileNotFoundError(f"The static folder {env.STATIC_PATH} does not exist.")

app = Flask(__name__, static_folder=env.STATIC_PATH)
app.secret_key = env.FLASK_SECRET_KEY

app.url_map.strict_slashes = False

app.config.from_object(Config())

scheduler = APScheduler()
scheduler.init_app(app)
scheduler.start()

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
    if login is None or login == "":
        return
    try:
        login = UserValidator(user=login).user
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
    app.run(debug=env.RUN_DEBUG, port=env.DEVSERVER_PORT)
