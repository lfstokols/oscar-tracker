import logging, os
from dotenv import load_dotenv
from flask import Flask
from flask_apscheduler import APScheduler
import shutil
from datetime import datetime
from pathlib import Path
from backend.scheduled_tasks.check_rss import update_user_watchlist
from backend.logic.storage_manager import StorageManager

"""
How to use:
import <this file>
scheduler = APScheduler()
scheduler.init_app(app)
scheduler.start()
"""
if (x := os.getenv("DATABASE_PATH")) is None:
    raise ValueError("DATABASE_PATH is not set in .env file")
Database_Path = Path(x)


class Config:
    JOBS = [
        {
            "id": "check_letterboxd",
            "func": "backend.scheduled_tasks.scheduling:check_letterboxd",
            "trigger": "interval",
            "hours": 1,
        },
        {
            "id": "backup_database",
            "func": "backend.scheduled_tasks.scheduling:backup_database",
            "trigger": "interval",
            "days": 1,
        },
    ]


def check_letterboxd():
    storage = StorageManager.get_storage()
    users = storage.read("users")
    for user_id in users.index:
        had_update = update_user_watchlist(user_id)
        if had_update:
            logging.info(f"Updated watchlist for user {user_id}")
        else:
            logging.info(f"No new movies found for user {user_id}")


def backup_database():
    """
    Creates a backup of the database files by copying them to a backup directory.
    """
    backup_dir = (
        Database_Path.parent / "backups" / datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    )

    # Create backup directory if it doesn't exist
    backup_dir.mkdir(parents=True, exist_ok=True)

    # Copy all files from database directory to backup directory
    for file in Database_Path.glob("**/*"):
        if file.is_file():
            # Preserve directory structure in backup
            relative_path = file.relative_to(Database_Path)
            backup_path = backup_dir / relative_path
            backup_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(file, backup_path)

    logging.info(f"Database backed up to {backup_dir}")
