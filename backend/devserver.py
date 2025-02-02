import sys, os, logging
from pathlib import Path
from datetime import datetime, timedelta
from flask import Flask, g, request, send_from_directory, abort, session
from flask_apscheduler import APScheduler

# * Add the project root to the system path
project_root_directory = Path(__file__).parent.parent
sys.path.append(str(project_root_directory))
os.environ["ROOT_DIR"] = str(project_root_directory)
import backend.utils.env_reader as env

# * Setup logging
from backend.utils.logging_config import setup_logging

setup_logging(env.LOG_PATH)
# * The rest of the imports
from backend.types.api_validators import UserValidator, AnnotatedValidator, validate_user_id
from backend.routing_lib.user_session import UserSession
from backend.scheduled_tasks.check_rss import update_user_watchlist
from backend.scheduled_tasks.scheduling import Config
import backend.data.db_connections
from backend.routes.database_routes import oscars

DEVSERVER_PORT = env.DEVSERVER_PORT  #! Gunicorn breaks without this!!!
logging.info(f"The port should be {DEVSERVER_PORT}.")


if not env.STATIC_PATH.exists():
    logging.error(f"The static folder {env.STATIC_PATH} does not exist, cannot start devserver.")
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


@app.route("/favicon.ico")
def favicon():
    return send_from_directory(
        "../public", "favicon.ico", mimetype="image/vnd.microsoft.icon"
    )


@app.before_request
def before_request():
    login = request.cookies.get("activeUserId")
    g.initial_user_id_value = login
    if login is None or login == "":
        return
    #! From here, assume cookie is _intended_ to have valid UserID
    id, code = validate_user_id(login)

    if code != 0:
        logging.error(f"[before_request()] Invalid user id {login} found in cookie.")
        UserSession.end()
        g.should_delete_cookie = True
        return
    
    if UserSession.id_matches_session(id):
        UserSession.log_activity()
    else:
        UserSession.start_new(id)

    if UserSession.is_time_to_update():
        update_user_watchlist(id)

if __name__ == "__main__":
    app.run(debug=env.RUN_DEBUG, port=env.DEVSERVER_PORT)
