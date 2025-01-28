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
from backend.sqlite.db_schema import init_db
from backend.sqlite.db_connections import get_connection
from backend.logic.storage_manager import StorageManager
from backend.data_management.db_schemas import (
    db_col_users,
    db_col_movies,
    db_col_categories,
    db_col_nominations,
    db_col_watchlist,
)

StorageManager.make_storage(env.DATABASE_PATH)
storage = StorageManager.get_storage()


def clean_na(value):
    """Convert pandas NA/NaN values to None for SQLite"""
    return None if pd.isna(value) else value


def migrate_users():
    with get_connection() as (conn, cursor):
        df = storage.read("users")

        for _, row in df.iterrows():
            debug_print(f"Migrating user {row.name}")
            cursor.execute(
                """
                REPLACE INTO users (user_id, username, letterboxd, email, last_letterboxd_check)
                VALUES (?, ?, ?, ?, ?)
            """,
                (
                    row.name,
                    clean_na(row["username"]),
                    clean_na(row["letterboxd"]),
                    clean_na(row["email"]),
                    clean_na(row["lastLetterboxdCheck"]),
                ),
            )


def migrate_movies(year: int):
    with get_connection() as (conn, cursor):
        df = storage.read("movies", year)

        for _, row in df.iterrows():
            debug_print(f"Migrating movie {row.name}")
            cursor.execute(
                """
                REPLACE INTO movies (year, movie_id, title, imdb_id, movie_db_id, runtime, poster_path)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
                (
                    year,
                    row.name,
                    clean_na(row["title"]),
                    clean_na(row["ImdbId"]),
                    clean_na(row["movieDbId"]),
                    clean_na(row["runtime"]),
                    clean_na(row["posterPath"]),
                ),
            )


def migrate_categories():
    with get_connection() as (conn, cursor):
        df = storage.read("categories")

        for _, row in df.iterrows():
            debug_print(f"Migrating category {row.name}")
            cursor.execute(
                """
                REPLACE INTO categories (category_id, short_name, full_name, has_note, is_short, grouping, max_nominations)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
                (
                    row.name,
                    row["shortName"],
                    row["fullName"],
                    row["hasNote"],
                    row["isShort"],
                    row["grouping"],
                    row["maxNoms"],
                ),
            )


def migrate_nominations(year: int):
    with get_connection() as (conn, cursor):
        df = storage.read("nominations", year)

        for _, row in df.iterrows():
            debug_print(
                f"Migrating nomination {row['movieId']} for category {row['categoryId']}"
            )
            cursor.execute(
                """
                INSERT INTO nominations (year, movie_id, category_id, note)
                VALUES (?, ?, ?, ?)
            """,
                (year, row["movieId"], row["categoryId"], clean_na(row["note"])),
            )


def migrate_watchlist(year: int):
    with get_connection() as (conn, cursor):
        df = storage.read("watchlist", year)

        for _, row in df.iterrows():
            debug_print(
                f"Migrating watchlist {row['userId']} for movie {row['movieId']}"
            )
            cursor.execute(
                """
                INSERT INTO watchlist (year, user_id, movie_id, status)
                VALUES (?, ?, ?, ?)
            """,
                (year, row["userId"], row["movieId"], row["status"]),
            )


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
