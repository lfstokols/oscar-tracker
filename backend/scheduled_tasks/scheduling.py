import logging
import sqlite3
from datetime import datetime

import sqlalchemy as sa
from apscheduler.schedulers.asyncio import AsyncIOScheduler

import backend.utils.env_reader as env
from backend.data.db_connections import Session
from backend.data.db_schema import User
from backend.scheduled_tasks.check_rss import update_user_watchlist


def register_jobs(scheduler: AsyncIOScheduler) -> None:
    """Register all scheduled jobs with the scheduler."""
    scheduler.add_job(
        check_letterboxd,
        trigger="interval",
        id="check_letterboxd",
        hours=18,
    )
    scheduler.add_job(
        backup_database,
        trigger="interval",
        id="backup_database",
        days=2,
    )


def check_letterboxd():
    with Session() as session:
        users = list(session.execute(sa.select(User.user_id)).scalars().all())
    for user_id in users:
        had_update = update_user_watchlist(user_id)
        if had_update:
            logging.info(f"Updated watchlist for user {user_id}")
        else:
            logging.info(f"No new movies found for user {user_id}")


def backup_database():
    """
    Creates a backup of the database files by copying them to a backup directory.
    """
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    main_db_filepath = env.DATABASE_PATH / env.SQLITE_FILE_NAME
    backup_db_filepath = env.BACKUPS_PATH / (timestamp + "_" + env.SQLITE_FILE_NAME)
    # * Create backup directory if it doesn't exist
    backup_db_filepath.parent.mkdir(parents=True, exist_ok=True)

    # * Create source and backup databases
    source_db = sqlite3.connect(main_db_filepath)
    backup_db = sqlite3.connect(backup_db_filepath)

    # * Perform the backup
    source_db.backup(backup_db)

    # * Clean up
    source_db.close()
    backup_db.close()

    # # * Copy all files from database directory to backup directory
    # for file in Database_Path.glob("**/*"):
    #     if file.is_file():
    #         # * Preserve directory structure in backup
    #         relative_path = file.relative_to(Database_Path)
    #         backup_path = backup_dir / relative_path
    #         backup_path.parent.mkdir(parents=True, exist_ok=True)
    #         shutil.copy2(file, backup_path)

    logging.info(f"Database backed up to {backup_db_filepath}")
