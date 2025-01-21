import os
import sys
from pathlib import Path

project_root_directory = Path(__file__).parent.parent
sys.path.append(str(project_root_directory))

from backend.logic.storage_manager import StorageManager

StorageManager.make_storage(project_root_directory / "backend" / "database")

from backend.scheduled_tasks.scheduling import Config
from flask import Flask, jsonify, request, render_template, send_from_directory, abort
from flask_apscheduler import APScheduler
from backend.oscarsEndpoint import oscars
from flask_cors import CORS
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(project_root_directory / ".env")
try:
    RUN_DEBUG = (os.getenv("RUN_DEBUG") or "").lower() == "true"
    DEVSERVER_PORT = int(os.getenv("DEVSERVER_PORT"))  # type: ignore
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


if __name__ == "__main__":
    app.run(debug=RUN_DEBUG, port=DEVSERVER_PORT)
