import os
import sys
from pathlib import Path

project_root_directory = Path(__file__).parent.parent
sys.path.append(str(project_root_directory))


from datetime import datetime, timedelta
from backend.data_management.api_validators import AnnotatedValidator
from backend.routing_lib.user_session import start_new_session, log_session_activity
from backend.logic.storage_manager import StorageManager

StorageManager.make_storage(project_root_directory / "backend" / "database")


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
    print(f"The port should be {DEVSERVER_PORT}.")
except Exception as e:
    print(f"The .env file is missing or has an error: {e}")
    raise

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
    return abort(404)


@app.route("/jokes")
def serve_joke():
    return "<h1>It's a joke!</h1>"


@app.route("/favicon.ico")
def favicon():
    return send_from_directory(
        "../public", "favicon.ico", mimetype="image/vnd.microsoft.icon"
    )


# * just recording the string to avoid mixups
activeUserId = "activeUserId"
# * this is what's in the cookie managed by the frontend


@app.before_request
def before_request():
    login = request.cookies.get(activeUserId)
    try:
        assert login is None or AnnotatedValidator(user=login)
    except Exception as e:
        print(f"Invalid user id {e} found in cookie.")
        login = None
        session.clear()

    if login and session.get("session_token") != login:
        start_new_session(login)

    if login and datetime.now() - session.get(
        "last_activity", datetime.min
    ) > timedelta(minutes=20):
        update_user_watchlist(login)
        log_session_activity()


"""
I'll expect the session to have a last_activity, session_start, and... a letterboxd_check_time
If it's been a half hour since the last activity, I'll assume they expect a refresh, and I'll check letterboxd
The initial time seems odd... well okay, so:
* You come on for the first time in days. Data is stale, should be refreshed.
* You come on after a few hours. Good chance you were in a theater. Data is stale, should be refreshed.
* You are on the site continuously for an hour. Idk why your letterboxd would have been updated. 
*           And if you did update letterboxd, you'd probably just manually refresh. I can't just guess when you do it.
* You come on, the rss wasn't updated yet. In that case you're probably just gonna add manually.
* You leave the page loaded up on your computer, so it seems like you're active. In that case, I'm never
*           gonna notice when you're actually active. Refresh daily, just like normal, but nothing else unless you clear the session somehow.
So, in addition to checks every 12 hours (regardless of activity), I'll refetch if someone logs in after 20 minutes of inactivity.
Switching accounts invalidates the session, starts a new one.
"""

if __name__ == "__main__":
    app.run(debug=RUN_DEBUG, port=DEVSERVER_PORT)
