import logging
import os
import sys
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from pathlib import Path

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import (
    SessionMiddleware as StarletteSessionMiddleware,
)

# * Add the project root to the system path
project_root_directory = Path(__file__).parent.parent
sys.path.append(str(project_root_directory))
os.environ["ROOT_DIR"] = str(project_root_directory)
import backend.utils.env_reader as env

# * Setup logging
from backend.utils.logging_config import setup_logging

setup_logging(env.LOG_PATH)
import backend.data.db_connections
from backend.routes.database_routes import router as oscars_router
from backend.routing_lib.error_handling import apply_error_handling
from backend.routing_lib.user_session import SessionMiddleware as MySessionMiddleware
from backend.scheduled_tasks.scheduling import register_jobs

# * The rest of the imports
from backend.types.api_validators import (
    AnnotatedValidator,
    UserValidator,
    validate_user_id,
)

DEVSERVER_PORT = env.DEVSERVER_PORT  #! Gunicorn breaks without this!!!
logging.info(f"The port should be {DEVSERVER_PORT}.")


if not env.STATIC_PATH.exists():
    logging.error(
        f"The static folder {env.STATIC_PATH} does not exist, cannot start devserver."
    )
    raise FileNotFoundError(f"The static folder {env.STATIC_PATH} does not exist.")

# Setup scheduler
scheduler = AsyncIOScheduler()
register_jobs(scheduler)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    scheduler.start()
    yield
    # Shutdown
    scheduler.shutdown()


app = FastAPI(lifespan=lifespan)

# Include the API routes
app.include_router(oscars_router, prefix="/api")

# Mount static files
app.mount("/", StaticFiles(directory=str(env.STATIC_PATH), html=True), name="static")


@app.get("/jokes")
async def serve_joke():
    return HTMLResponse("<h1>It's a joke!</h1>")


@app.get("/favicon.ico")
async def favicon():
    return FileResponse("../public/favicon.ico", media_type="image/vnd.microsoft.icon")


app.add_middleware(MySessionMiddleware)
app.add_middleware(
    StarletteSessionMiddleware,
    secret_key=env.FLASK_SECRET_KEY,
    max_age=7 * 24 * 60 * 60,  # 7 days
    same_site="lax",
)


# @app.middleware("http")
# async def before_request(request: Request):
#     login = request.cookies.get("activeUserId")
#     request.state.initial_user_id_value = login
#     if login is None or login == "":
#         return
#     #! From here, assume cookie is _intended_ to have valid UserID
#     id, code = validate_user_id(login)

#     if code != 0:
#         logging.error(f"[before_request()] Invalid user id {login} found in cookie.")
#         UserSession.end()
#         request.state.should_delete_cookie = True
#         return

#     if UserSession.id_matches_session(id):
#         UserSession.log_activity()
#     else:
#         UserSession.start_new(id)

#     if UserSession.is_time_to_update():
#         update_user_watchlist(id)


apply_error_handling(app)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=env.DEVSERVER_PORT,
        log_level="info" if env.RUN_DEBUG else "warning",
    )
