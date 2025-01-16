import pandas as pd
from backend.data_management.api_schemas import db_Nom
from backend.logic.StorageManager import StorageManager
from backend.logic.MyTypes import *
from typing import Any


def add_user(storage: StorageManager, username, letterboxd=None, email=None) -> UserID:
    user_id = storage.create_unique_user_id()
    newEntry = pd.DataFrame(
        {
            UserColumns.NAME: username,
            UserColumns.LETTERBOXD: letterboxd,
            UserColumns.EMAIL: email,
        },
        index=[user_id],
    )

    def operation(data: pd.DataFrame):
        return pd.concat([data, newEntry], axis="index", ignore_index=True), user_id

    return storage.edit(operation, "users")


def update_user(storage, userId, new_data: dict):
    storage.validate_id(userId, "users")

    def operation(data: pd.DataFrame):
        assert userId in data.index, f"User '{userId}' not found."
        assert not (
            "id" in new_data.keys() or "userId" in new_data.keys()
        ), "Cannot update user id"
        if not all([x in data.columns for x in new_data.keys()]):
            raise Exception(f"Invalid columns in new data: {new_data.keys()}.")
        data.loc[userId, new_data.keys()] = new_data.values()
        return data, None

    return storage.edit(operation, "users")


def delete_user(storage, userId):
    def operation(data: pd.DataFrame):
        data = data.drop(userId)
        return data, None

    return storage.edit(operation, "users")


# Deletes existing entry if it exists
# returns True if the entry already existed, False if it didn't
def add_watchlist_entry(storage, year, userId, movieId, status: WatchStatus) -> bool:
    storage.validate_id(userId, "users")
    storage.validate_id(movieId, "movies")
    assert status in WatchStatus.values(), f"Invalid status '{status}'."

    def operation(data: pd.DataFrame):
        existing_entry = data[
            (data[WatchlistColumns.USER] == userId)
            & (data[WatchlistColumns.MOVIE] == movieId)
        ]
        data = data.drop(existing_entry.index)

        if status != WatchStatus.BLANK:
            new_entry = pd.DataFrame(
                {
                    WatchlistColumns.USER: [userId],
                    WatchlistColumns.MOVIE: [movieId],
                    WatchlistColumns.STATUS: [status],
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
def add_nomination(storage, year, nomination: db_Nom, validate=False):
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
    movie = nomination[NomColumns.MOVIE]
    category = nomination[NomColumns.CATEGORY]
    note = nomination[NomColumns.NOTE] if NomColumns.NOTE in nomination else None
    storage.validate_id(movie, "m")
    storage.validate_id(category, "c")

    def operation(data: pd.DataFrame):
        newEntry = pd.DataFrame(
            {
                NomColumns.MOVIE: movie,
                NomColumns.CATEGORY: category,
                NomColumns.NOTE: note,
            }
        )
        data = pd.concat([data, newEntry], ignore_index=True)
        return data, None

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
    storage, movie, year, new_data: dict[str, Any] = {}, try_title_lookup=False
) -> MovID | bool:
    for val in new_data.values():
        if "," in str(val):
            print(
                f"There's a comma in the data. That could mess up the CSV file, "
                "but I think pandas deals with it automatically.\n"
                "Continuing for now, but check if you corrupted the data and figure out a fix if so.\n"
                f"Weird data: {str(val)}"
            )
    if not try_title_lookup:
        movieId = movie
        try:
            storage.validate_id(movieId, "m")
        except:
            raise Exception(
                f"Invalid movie id '{movieId}'.\n"
                "Did you mean to send a title? Consider try_title_lookup=True."
            )

        def operation(data):
            was_there = movieId in data.index
            data.loc[movieId, new_data.keys()] = new_data.values()
            return data, was_there

    else:

        def operation(data):
            if movie in data[MovieColumns.TITLE].tolist():
                movieId = data.loc[data[MovieColumns.TITLE] == movie].index[0]
                data.loc[movieId, new_data.keys()] = new_data.values()
            else:
                movieId = storage.create_unique_id(
                    "m", year=year, existing_ids=data.index
                )
                data.loc[movieId] = {MovieColumns.TITLE: movie, **new_data}
            return data, movieId

    return storage.edit(operation, "movies", year)


def add_movie(storage: StorageManager, year: int | str, title: str) -> MovID:
    id = storage.create_unique_movie_id(year=year)
    newEntry = pd.DataFrame({MovieColumns.TITLE: title}, index=[id])

    def operation(data: pd.DataFrame):
        return pd.concat([data, newEntry], axis="index", ignore_index=True), id

    return storage.edit(operation, "movies", year)
