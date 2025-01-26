import sqlite3, logging
from contextlib import contextmanager
import pandas as pd
from backend.sqlite.id_creation import create_unique_user_id, create_unique_movie_id
from backend.data_management.db_schemas import (
    db_col_users,
    db_col_movies,
    db_col_categories,
    db_col_watchlist,
    db_col_nominations,
    WatchStatus,
)
from backend.types.api_schemas import UserID, MovieID, CategoryID
from backend.types.api_validators import AnnotatedValidator
from backend.logic.storage_manager import StorageManager
from backend.sqlite.make_db import get_connection
from backend.types.my_types import *
from typing import Any


def add_user(username: str, **kwargs) -> UserID:
    user_id = create_unique_user_id()
    with get_connection() as (conn, cursor):
        try:
            assert username is not None
            assert all(
                key in [col.value for col in db_col_users] for key in kwargs
            ), f"Invalid user column(s): {[k for k in kwargs if k not in [col.value for col in db_col_users]]}"
        except Exception as e:
            logging.error(f"Tried to add new user with invalid columns: {e}")
            raise e
        cursor.execute(
            "INSERT INTO users (user_id, username, letterboxd, email) VALUES (?, ?, ?, ?)",
            (
                user_id,
                username,
                kwargs.get(db_col_users.letterboxd.value),
                kwargs.get(db_col_users.email.value),
            ),
        )
    return user_id


def update_user(userId: UserID, new_data: dict[db_col_users, str]):
    assert all(
        key in [col.value for col in db_col_users] for key in new_data
    ), f"Invalid user column(s): {[k for k in new_data if k not in [col.value for col in db_col_users]]}"
    with get_connection() as (conn, cursor):
        cursor.execute(
            "UPDATE users SET username = ?, letterboxd = ?, email = ? WHERE user_id = ?",
            (
                new_data[db_col_users.username],
                new_data[db_col_users.letterboxd],
                new_data[db_col_users.email],
                userId,
            ),
        )


def delete_user(userId):
    with get_connection() as (conn, cursor):
        cursor.execute("DELETE FROM users WHERE user_id = ?", (userId,))


@contextmanager
def get_and_set_rss_timestamp(userId: UserID):
    with get_connection() as (conn, cursor):
        cursor.execute(
            "SELECT last_checked FROM users WHERE user_id = ?",
            (userId,),
        )
        last_checked = pd.Timestamp(cursor.fetchone()[0], tz="UTC")
        new_time = pd.Timestamp.now(tz="UTC")
        try:
            yield last_checked
        except Exception as e:
            logging.error(
                f"Error while checking rss, last_checked_time not updated: {e}"
            )
            raise e
        else:
            cursor.execute(
                "UPDATE users SET last_letterboxd_check = ? WHERE user_id = ?",
                (new_time, userId),
            )


# Deletes existing entry if it exists
# returns True if the entry already existed, False if it didn't
def add_watchlist_entry(
    year: int, userId: UserID, movieId: MovieID, status: WatchStatus
):
    with get_connection() as (_, cursor):
        if status == WatchStatus.BLANK:
            cursor.execute(
                "DELETE FROM watchlist WHERE year = ? AND user_id = ? AND movie_id = ?",
                (year, userId, movieId),
            )
        else:
            cursor.execute(
                "REPLACE INTO watchlist (year, user_id, movie_id, status) VALUES (?, ?, ?, ?)",
                (year, userId, movieId, status.value),
            )


# Note: This function does not check if the nomination already exists in the database
# 	If there's a possibliity of duplicates, you've done something wrong
# Checks if `movie`, `category` are formatted as IDs
# Does NOT check if they actually exist in the database
# 	If you didn't already add/confirm them yourstorage, you're doing something wrong
# If `validate` is True, the function will at least check if there are too many nominations in a category
def add_nomination(year, nomination: Nom):
    """Adds a nomination to the database.

    Args:
        year (str | int): The year of the nomination.
        nomination ({dict<NomColumns, str>}): The nomination to add.
        validate (bool, optional): Whether to validate the nomination. Defaults to False.

    Raises:
        Exception: If the nomination keys are invalid,
            or if the nomination is too many nominations in a category,
            or if the file is locked.

    Returns:
        None: The function does not return anything.
    """
    movie = nomination[NomColumns.MOVIE.value]
    category = nomination[NomColumns.CATEGORY.value]
    note = (
        nomination[NomColumns.NOTE.value]
        if NomColumns.NOTE.value in nomination
        else None
    )
    with get_connection() as (_, cursor):
        cursor.execute(
            "INSERT INTO nominations (year, movie_id, category_id, note) VALUES (?, ?, ?, ?)",
            (year, movie, category, note),
        )


# `movie` is usually the id of the movie to update
# If try_title_lookup, then `movie` is interpreted as the title of the movie
# 		In that case, the id of the movie is returned (whether it was found or created)
# `new_data` is a dictionary of new data to add or update
def update_movie(
    movie: MovieID,
    year: int,
    new_data: dict[db_col_movies, Any] = {},
):
    movieId = movie
    try:
        AnnotatedValidator(movie=movieId)
    except:
        raise Exception(f"Invalid movie id '{movieId}'.\n" "Did you send a title?")
    with get_connection() as (_, cursor):
        for key, value in new_data.items():
            cursor.execute(
                f"UPDATE movies SET {key} = ? WHERE movie_id = ?",
                (value, movieId),
            )


def add_movie(year: int, title: str) -> MovieID:
    id = create_unique_movie_id(year=year)
    with get_connection() as (_, cursor):
        cursor.execute(
            "INSERT INTO movies (year, movie_id, title) VALUES (?, ?, ?)",
            (year, id, title),
        )
    return id
