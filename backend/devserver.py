import logging
import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

sys.path.append(os.environ.get("ROOT_DIR"))

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from starlette.middleware.sessions import (
    SessionMiddleware as StarletteSessionMiddleware,
)

import backend.utils.env_reader as env
from backend.routes.admin_routes import page_router as admin_page_router
from backend.routes.database_routes import router as oscars_router
from backend.routing_lib.error_handling import apply_error_handling
from backend.routing_lib.user_session import SessionMiddleware as MySessionMiddleware
from backend.scheduled_tasks.scheduling import register_jobs
from backend.utils.logging_config import setup_logging

# * Add the project root to the system path
project_root_directory = Path(__file__).parent.parent
sys.path.append(str(project_root_directory))
os.environ["ROOT_DIR"] = str(project_root_directory)

# * Setup logging

setup_logging(env.LOG_PATH)

DEVSERVER_PORT = env.DEVSERVER_PORT  # ! Gunicorn breaks without this!!!
logging.info(f"The port should be {DEVSERVER_PORT}.")


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


app = FastAPI(lifespan=lifespan, redirect_slashes=False)

# Include the API routes
app.include_router(oscars_router, prefix="/api")
app.include_router(admin_page_router, prefix="/admin")


# Middleware runs in REVERSE order of registration
# StarletteSessionMiddleware must run first to create request.session
app.add_middleware(MySessionMiddleware)
app.add_middleware(
    StarletteSessionMiddleware,
    secret_key=env.FLASK_SECRET_KEY,
    max_age=7 * 24 * 60 * 60,  # 7 days
    same_site="lax",
)


apply_error_handling(app)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        'backend.devserver:app',
        host="0.0.0.0",
        port=env.DEVSERVER_PORT,
        log_level="info" if env.RUN_DEBUG else "warning",
        reload=env.RUN_DEBUG,
    )
