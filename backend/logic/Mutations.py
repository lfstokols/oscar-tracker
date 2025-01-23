import logging
import pandas as pd
from backend.types.api_schemas import (
    UserID,
    MovieID,
    CategoryID,
    WatchStatus,
)
from backend.data_management.api_validators import AnnotatedValidator
from backend.logic.storage_manager import StorageManager
from backend.types.my_types import *
from typing import Any


def add_user(storage: StorageManager, username, letterboxd=None, email=None) -> UserID:
    user_id = storage.create_unique_user_id()
    newEntry = pd.DataFrame(
        {
            UserColumns.NAME.value: username,
            UserColumns.LETTERBOXD.value: letterboxd,
            UserColumns.EMAIL.value: email,
        },
        index=[user_id],
    )

    def operation(data: pd.DataFrame):
        return pd.concat([data, newEntry], axis="index"), user_id

    return storage.edit(operation, "users")


def update_user(
    storage: StorageManager, userId: UserID, new_data: dict[UserColumns, str]
):
    storage.validate_id(userId, "users")

    def operation(data: pd.DataFrame):
        assert userId in data.index, f"User '{userId}' not found."
        assert not ("id" in new_data or "userId" in new_data), "Cannot update user id"
        if not all([x in data.columns for x in new_data.keys()]):
            raise Exception(f"Invalid columns in new data: {new_data.keys()}.")
        for key, value in new_data.items():
            data.at[userId, key] = value
        return data, None

    return storage.edit(operation, "users")


def delete_user(storage, userId):
    def operation(data: pd.DataFrame):
        data = data.drop(userId)
        return data, None

    return storage.edit(operation, "users")


def get_and_set_rss_timestamp(userId: UserID) -> pd.Timestamp:
    storage = StorageManager.get_storage()

    def operation(data: pd.DataFrame):
        last_val = pd.Timestamp(
            data[UserColumns.LAST_CHECKED.value].fillna(pd.Timestamp.min).at[userId],
            tz="UTC",
        )
        data.at[userId, UserColumns.LAST_CHECKED.value] = pd.Timestamp.now(tz="UTC")
        return data, last_val

    return storage.edit(operation, "users")


# Deletes existing entry if it exists
# returns True if the entry already existed, False if it didn't
def add_watchlist_entry(
    storage: StorageManager, year, userId, movieId, status: WatchStatus
) -> bool:
    storage.validate_id(userId, "users")
    storage.validate_id(movieId, "movies")
    assert status in list(WatchStatus), f"Invalid status '{status}'."

    def operation(data: pd.DataFrame):
        existing_entry = data[
            (data[WatchlistColumns.USER.value] == userId)
            & (data[WatchlistColumns.MOVIE.value] == movieId)
        ]
        data = data.drop(existing_entry.index)

        if status != WatchStatus.BLANK:
            new_entry = pd.DataFrame(
                {
                    WatchlistColumns.USER.value: [userId],
                    WatchlistColumns.MOVIE.value: [movieId],
                    WatchlistColumns.STATUS.value: [status],
                }
            )
            data = pd.concat([data, new_entry], ignore_index=True)
        return data, (not existing_entry.empty)

    return storage.edit(operation, "watchlist", year)


# Note: This function does not check if the nomination already exists in the database
# 	If there's a possibliity of duplicates, you've done something wrong
# Checks if `movie`, `category` are formatted as IDs
# Does NOT check if they actually exist in the database
# 	If you didn't already add/confirm them yourstorage, you're doing something wrong
# If `validate` is True, the function will at least check if there are too many nominations in a category
def add_nomination(storage: StorageManager, year, nomination: Nom, validate=False):
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
    storage.validate_id(movie, "movies")
    storage.validate_id(category, "categories")

    def operation(data: pd.DataFrame):
        # * Check if an identical nomination already exists
        existing_entry = data[
            (data[NomColumns.MOVIE.value] == movie)
            & (data[NomColumns.CATEGORY.value] == category)
            & (data[NomColumns.NOTE.value] == note)
        ]
        if not existing_entry.empty:
            return data, 1
        # * Okay, it's novel, continue
        newEntry = pd.DataFrame(
            [
                {
                    NomColumns.MOVIE.value: movie,
                    NomColumns.CATEGORY.value: category,
                    NomColumns.NOTE.value: note,
                }
            ]
        )
        data = pd.concat([data, newEntry], ignore_index=True)
        return data, 0

    if validate:
        bad_cats = storage.validate_nomination_list(year)
        if bad_cats:
            raise Exception(f"Too many nominations in these categories: {bad_cats}.")
    storage.edit(operation, "nominations", year)

    # Adds a new movie to the database, or updates an existing one


# `movie` is usually the id of the movie to update
# If try_title_lookup, then `movie` is interpreted as the title of the movie
# 		In that case, the id of the movie is returned (whether it was found or created)
# `new_data` is a dictionary of new data to add or update
def update_movie(
    storage: StorageManager,
    movie: MovieID,
    year: int | str,
    new_data: dict[str, Any] = {},
    try_title_lookup: bool = False,
) -> MovID | bool:
    for val in new_data.values():
        if "," in str(val):
            logging.warning(
                f"There's a comma in the data. That could mess up the CSV file, "
                "but I think pandas deals with it automatically.\n"
                "Continuing for now, but check if you corrupted the data and figure out a fix if so.\n"
                f"Weird data: {str(val)}"
            )
    if not try_title_lookup:
        movieId = movie
        try:
            AnnotatedValidator(movie=movieId)
        except:
            raise Exception(
                f"Invalid movie id '{movieId}'.\n"
                "Did you mean to send a title? Consider try_title_lookup=True."
            )

        def update_existing_movie(data):
            was_there = movieId in data.index
            for key, value in new_data.items():
                data.at[movieId, key] = value
            return data, was_there

        return storage.edit(update_existing_movie, "movies", year)

    else:

        def update_or_create_movie(data):
            if movie in data[MovieColumns.TITLE.value].tolist():
                movieId = data.loc[data[MovieColumns.TITLE.value] == movie].index[0]
                for key, value in new_data.items():
                    data.at[movieId, key] = value
            else:
                movieId = storage.create_unique_movie_id(year=year)
                data.at[movieId] = {MovieColumns.TITLE.value: movie, **new_data}
            return data, movieId

        return storage.edit(update_or_create_movie, "movies", year)


def add_movie(storage: StorageManager, year: int | str, title: str) -> MovID:
    id = storage.create_unique_movie_id(year=year)
    newEntry = pd.DataFrame({MovieColumns.TITLE.value: title}, index=[id])

    def operation(data: pd.DataFrame):
        return pd.concat([data, newEntry], axis="index"), id

    return storage.edit(operation, "movies", year)
