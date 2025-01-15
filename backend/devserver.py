import os
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))
from flask import Flask, jsonify, request, render_template, send_from_directory
from backend.oscarsEndpoint import oscars
from flask_cors import CORS
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent.parent / ".env")
try:
    RUN_DEBUG = (os.getenv("RUN_DEBUG") or "").lower() == "true"
    DEVSERVER_PORT = int(os.getenv("DEVSERVER_PORT"))
    print(f"The port should be {DEVSERVER_PORT}.")
except Exception as e:
    print(f"The .env file is missing or has an error: {e}")
    raise

app = Flask(__name__)

app.url_map.strict_slashes = False

CORS(
    app,
    origins=[
        "https://yourusername.github.io",
        "AB8AFE442E2688F92E945596E7055152D.asuscomm.com",
        "http://localhost:8000",
    ],
    methods=["GET", "POST", "PUT", "OPTIONS"],
)

app.register_blueprint(oscars, url_prefix="/oscars/")


@app.route("/")
def serve_root():
    return send_from_directory("../public", "logan_homepage.html")


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
