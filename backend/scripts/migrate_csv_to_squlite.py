import argparse
import sqlite3
import pandas as pd
from pathlib import Path
import sys, os

# * local imports
PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.append(str(PROJECT_ROOT))
os.environ["ROOT_DIR"] = str(PROJECT_ROOT)
import backend.utils.env_reader as env
from backend.data.db_schema import (
    init_db,
    Movie,
    User,
    Category,
    Nomination,
    Watchnotice,
)
from backend.data.db_connections import Session
import sqlalchemy as sa
from backend.logic.storage_manager import StorageManager


StorageManager.make_storage(env.DATABASE_PATH)
storage = StorageManager.get_storage()


def clean_na(value):
    """Convert pandas NA/NaN values to None for SQLite"""
    return None if pd.isna(value) else value


def migrate_users():
    df = storage.read("users")
    with Session() as session:
        for _, row in df.iterrows():
            debug_print(f"Migrating user {row.name}")
            session.execute(
                sa.insert(User)
                .prefix_with("OR REPLACE")
                .values(
                    id=row.name,
                    username=clean_na(row["username"]),
                    letterboxd=clean_na(row["letterboxd"]),
                    email=clean_na(row["email"]),
                    last_letterboxd_check=clean_na(row["lastLetterboxdCheck"]),
                )
            )
        debug_print("Ready to commit")
        session.commit()


def migrate_movies(year: int):
    df = storage.read("movies", year)
    with Session() as session:
        for _, row in df.iterrows():
            debug_print(f"Migrating movie {row.name}")
            session.execute(
                sa.insert(Movie)
                .prefix_with("OR REPLACE")
                .values(
                    year=year,
                    id=row.name,
                    title=clean_na(row["title"]),
                    imdb_id=clean_na(row["ImdbId"]),
                    movie_db_id=clean_na(row["movieDbId"]),
                    runtime=clean_na(row["runtime"]),
                    poster_path=clean_na(row["posterPath"]),
                )
            )
        debug_print("Ready to commit")
        session.commit()


def migrate_categories():
    df = storage.read("categories")
    with Session() as session:
        for _, row in df.iterrows():
            debug_print(f"Migrating category {row.name}")
            session.execute(
                sa.insert(Category)
                .prefix_with("OR REPLACE")
                .values(
                    id=row.name,
                    short_name=clean_na(row["shortName"]),
                    full_name=clean_na(row["fullName"]),
                    has_note=clean_na(row["hasNote"]),
                    is_short=clean_na(row["isShort"]),
                    grouping=clean_na(row["grouping"]),
                    max_nominations=clean_na(row["maxNoms"]),
                )
            )
        debug_print("Ready to commit")
        session.commit()


def migrate_nominations(year: int):
    df = storage.read("nominations", year)
    with Session() as session:
        for _, row in df.iterrows():
            debug_print(
                f"Migrating nomination {row['movieId']} for category {row['categoryId']}"
            )
            session.execute(
                sa.insert(Nomination)
                .prefix_with("OR REPLACE")
                .values(
                    year=year,
                    movie_id=row["movieId"],
                    category_id=row["categoryId"],
                    note=clean_na(row["note"]),
                )
            )
        debug_print("Ready to commit")
        session.commit()


def migrate_watchlist(year: int):
    df = storage.read("watchlist", year)
    with Session() as session:
        for _, row in df.iterrows():
            debug_print(
                f"Migrating watchlist {row['userId']} for movie {row['movieId']}"
            )
            session.execute(
                sa.insert(Watchnotice)
                .prefix_with("OR REPLACE")
                .values(
                    year=year,
                    user_id=row["userId"],
                    movie_id=row["movieId"],
                    status=clean_na(row["status"]),
                )
            )
        debug_print("Ready to commit")
        session.commit()


def migrate_year(year: int):
    debug_print(f"Migrating data for year {year}")
    migrate_movies(year)
    migrate_nominations(year)
    migrate_watchlist(year)


def parse_args():
    parser = argparse.ArgumentParser(description="Copies CSV database data to SQLite.")
    parser.add_argument(
        "--year",
        type=int,
        help="Year to import data for. Year is when movies are released, "
        "not when the Oscars ceremony is held. "
        "Leave blank to migrate yearless data (users, categories)",
        required=False,
    )
    parser.add_argument(
        "-a",
        "--all",
        action="store_true",
        help="Migrates all data.",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Prints additional information.",
    )
    return parser.parse_args()


def run_migration():
    args = parse_args()
    year = args.year
    global verbose
    all = args.all
    verbose = args.verbose

    # Initialize new database
    debug_print("Initializing database")
    init_db()

    # Migrate each table
    if year is None or all:
        debug_print("Migrating yearless data")
        migrate_users()
        migrate_categories()
    else:
        migrate_year(year)
    if all:
        migrate_year(2023)
        migrate_year(2024)


def debug_print(message):
    if verbose:
        print("LOG: " + str(message))


if __name__ == "__main__":
    run_migration()
