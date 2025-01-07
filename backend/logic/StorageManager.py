# from datetime import time
# from time import sleep
import random
from pathlib import Path
import re
import pandas as pd
import numpy as np
import sys
from contextlib import contextmanager

if sys.platform.startswith("win"):
    import msvcrt
else:
    import fcntl
from collections.abc import Callable
from backend.logic.MyTypes import *
from typing import Literal


class StorageManager:
    def __init__(self, database_directory):
        self.dir = Path(database_directory)
        self.retry_interval = 0.1
        self.max_retries = 10
        # Flavor info
        self.flavor_list: dict[DataFlavor] = [
            "movies",
            "users",
            "nominations",
            "categories",
            "watchlist",
        ]
        self.flavor_aliases = {
            **{
                flavor: flavor for flavor in self.flavor_list
            },  # Each flavor is its own alias
            **{
                flavor[:1]: flavor for flavor in self.flavor_list
            },  # First letter of each flavor is an alias
            "mov": "movies",
            "usr": "users",
            "cat": "categories",  # aliases from id prefixes
        }
        # Default dataframes for file creation
        print(type(MovieColumns))
        print(MovieColumns)
        print(type(MovieColumns.ID))
        print(MovieColumns.ID)
        print(MovieColumns.ID == "id")
        self.DEFAULT_MOVIES = pd.DataFrame(
            columns=[col for col in MovieColumns.values()]
        ).set_index(MovieColumns.ID)
        self.DEFAULT_MOVIES.astype(
            {
                MovieColumns.TITLE: "string",
                MovieColumns.IMDB_ID: "string",
                MovieColumns.RUNTIME_HOURS: "string",
                MovieColumns.RUNTIME_MINUTES: "Int64",
                MovieColumns.NUM_NOMS: "Int64",
            }
        )
        self.DEFAULT_NOMINATIONS = pd.DataFrame(
            columns=[col for col in NomColumns.values()]
        )
        self.DEFAULT_NOMINATIONS.astype(
            {
                NomColumns.MOVIE: "string",
                NomColumns.CATEGORY: "string",
                NomColumns.NOTE: "string",
            }
        )
        self.DEFAULT_USERS = pd.DataFrame(
            columns=[col for col in UserColumns.values()]
        ).set_index(UserColumns.ID)
        self.DEFAULT_USERS.astype(
            {
                UserColumns.NAME: "string",
                UserColumns.LETTERBOXD: "string",
                UserColumns.EMAIL: "string",
            }
        )
        self.DEFAULT_CATEGORIES = pd.DataFrame(
            columns=[col for col in CategoryColumns.values()]
        ).set_index(CategoryColumns.ID)
        self.DEFAULT_CATEGORIES.astype(
            {
                CategoryColumns.SHORT_NAME: "string",
                CategoryColumns.FULL_NAME: "string",
                CategoryColumns.MAX_NOMS: "Int64",
                CategoryColumns.IS_SHORT: "boolean",
                CategoryColumns.HAS_NOTE: "boolean",
                CategoryColumns.GROUPING: "string",
            }
        )
        self.DEFAULT_WATCHLIST = pd.DataFrame(
            columns=[col for col in WatchlistColumns.values()]
        )
        self.DEFAULT_WATCHLIST.astype(
            {
                WatchlistColumns.USER: "string",
                WatchlistColumns.MOVIE: "string",
                WatchlistColumns.STATUS: "string",
            }
        )

    # * Never, ever specify a filepath in string format. Do everything in Path objects.
    # *  The initialization of the StorageManager class may take a string as input, but after that we do it all programatically.

    # * Never, ever indicate a column name as a string literal.
    # * Use the enum values instead.

    # So far I only use this inside of an `operation` function,
    # 		so I should take the existing list directly instead of reading from a file
    def create_unique_id(
        self, flavor: DataFlavor, existing_ids, year=None
    ) -> MovID | UserID:
        flavor = self.format_flavor(flavor)
        assert (
            self.flavor_props(flavor)["shape"] == "entity"
        ), f"Flavor '{flavor}' doesn't have IDs."
        assert (
            flavor != "categories"
        ), "Category IDs are static. You can't create new ones."
        try:
            id_prefix = {"movies": "mov_", "users": "usr_"}[flavor]
        except:
            raise Exception("Invalid type. Must be 'movie' or 'user'.")

        while tries < 100:
            if flavor == "movies":
                first_digits = f"{(year-1927)%256:02x}" if str(year).isdigit() else "00"
            else:
                first_digits = f"{random.randint(0, 0xFF):02x}"
            id = id_prefix + first_digits + f"{random.randint(0, 0xFFFF):04x}"
            if id not in existing_ids:
                return id
            tries += 1
        raise Exception(
            "Unable to create unique ID. Erroring out to avoid infinite loop."
        )

    # Converts flavor from alias
    # Throws on invalid flavor
    def format_flavor(self, flavor) -> DataFlavor:
        assert flavor in self.flavor_aliases.keys(), f"Invalid flavor '{flavor}'."
        return self.flavor_aliases[flavor]

    # Returns the filenames for the data of a certain flavor and year
    # Value is tuple, (.csv, .json)
    def get_filename(self, flavor, year=None) -> tuple[Path, Path]:
        # Format inputs
        flavor = self.format_flavor(flavor)

        is_annual = self.flavor_props(flavor)["annual"]
        if is_annual:
            assert year is not None
        year = str(year)
        # Create filename
        filename = self.dir
        if is_annual:
            filename = filename / year
        filenames = filename / f"table_{flavor}.csv", filename / f"table_{flavor}.json"
        return filenames

    # 'flavor_indic' can be a DataFlavor or a Path object
    # if 'is_filename=False', then function WILL throw on invalid flavor
    # 'shape' tells you if the flavor in question refers to an edge list or an entity list
    # 		An entity list has each row as a separate entity, with an ID column,
    # 			and the rest of the columns represent attributes
    # 		An edge list has no ID column. The first two columns are IDs for the related entities,
    # 			and the remaining columns are properties of that relationship
    # 'static' tells you if the flavor is a static table that should not be edited
    # 'annual' tells you if the tables exist only once or if there are copies in each year folder
    def flavor_props(
        self, flavor_indic, is_filename=False
    ) -> dict[Literal["shape", "static", "annual"], str | bool]:
        props = {"shape": None, "static": False, "annual": True}
        if is_filename:
            file = flavor_indic
            name = file.name
            for flv in self.flavor_list:
                if flv in name:
                    flavor = flv
        else:
            flavor = self.format_flavor(flavor_indic)
        # After this point, `flavor` is a string of type DataFlavor
        if flavor in ["nominations", "watchlist"]:
            props["shape"] = "edge"
        else:
            props["shape"] = "entity"
        if flavor in ["categories", "c"]:
            props["static"] = True
        if flavor in ["categories", "users"]:
            props["annual"] = False
        return props

    # Checks if an ID is valid for a certain flavor
    def validate_id(self, id, flavor=None):
        if flavor:
            flavor = self.format_flavor(flavor)
        else:
            flavor = self.format_flavor(id[:2])
        if flavor == "movies":
            assert (
                re.match(r"^mov_[0-9a-fA-F]{6}$", id) != None
            ), f"Invalid movie id '{id}'."
        elif flavor == "users":
            assert (
                re.match(r"^usr_[0-9a-fA-F]{6}$", id) != None
            ), f"Invalid user id '{id}'."
        elif flavor == "categories":
            assert (
                re.match(r"^cat_[a-z]{4}$", id) != None
            ), f"Invalid category id '{id}'."
        else:
            raise Exception(f"Invalid flavor '{flavor}' for ID number.")

    def flavor_from_file(self, file: Path) -> DataFlavor:
        for flavor in self.flavor_list:
            if flavor in file.name:
                return flavor
        raise Exception(f"File {file} does not correspond to a known flavor.")

    def files_to_df(self, files, flavor) -> pd.DataFrame:
        flavor_props = self.flavor_props(flavor)
        tfile, jfile = files
        data = pd.read_csv(tfile)  # , na_values='NaN')
        dtypes = pd.read_json(jfile, typ="series")
        data = data.astype(dtypes)
        if flavor_props["shape"] == "entity":
            assert (
                MovieColumns.ID == "id"
                and UserColumns.ID == "id"
                and CategoryColumns.ID == "id"
            ), "The index field must always be called 'id'."
            #! This hardcodes that the index field must be called 'id'
            data.set_index("id", inplace=True)
        return data

    def df_to_files(self, data, files) -> None:
        tfile, jfile = files
        for file in files:
            file.seek(0)
            file.truncate()
        flavor = self.flavor_from_file(tfile)
        index = self.flavor_props(flavor)["shape"] == "entity"
        data.to_csv(tfile, index=index, lineterminator="\n")
        data.dtypes.apply(str).to_json(jfile)

    def df_to_jsonable(self, df: pd.DataFrame, flavor) -> list[dict]:
        if self.flavor_props(flavor)["shape"] == "entity":
            df = df.reset_index()
        df = df.replace({np.nan: None})
        return df.to_dict(orient="records")

    @contextmanager
    def file_access(self, filepath: Path, mode="r", **kwargs):
        assert mode in ["r", "w", "r+", "x"]
        if mode == "w":
            mode = "r+"
        default_args = {
            "retry": True,
            "max_retries": self.max_retries,
            "retry_interval": self.retry_interval,
        }
        args = {**default_args, **kwargs}
        retry = args["retry"]
        max_retries = args["max_retries"]
        retry_interval = args["retry_interval"]
        attempts = 0
        should_delete = args["should_delete"] if "should_delete" in args else False
        wants_exclusive = "+" in mode

        if not filepath[0].exists():
            if "movies" in filepath[0].name:
                with open(filepath[0], "w") as file1:
                    with open(filepath[1], "w") as file2:
                        self.df_to_files(self.DEFAULT_MOVIES, (file1, file2))
            elif "nominations" in filepath[0].name:
                with open(filepath[0], "w") as file1:
                    with open(filepath[1], "w") as file2:
                        self.df_to_files(self.DEFAULT_NOMINATIONS, (file1, file2))
            elif "users" in filepath[0].name:
                with open(filepath[0], "w") as file1:
                    with open(filepath[1], "w") as file2:
                        self.df_to_files(self.DEFAULT_USERS, (file1, file2))
            elif "watchlist" in filepath[0].name:
                with open(filepath[0], "w") as file1:
                    with open(filepath[1], "w") as file2:
                        self.df_to_files(self.DEFAULT_WATCHLIST, (file1, file2))
            else:
                raise Exception(
                    f"File {filepath} does not exist but should exist. I won't create it automatically."
                )

        # while True:
        try:
            with open(filepath[0], mode, encoding="utf-8") as file:
                with open(filepath[1], mode, encoding="utf-8") as file2:
                    try:
                        if sys.platform.startswith("win"):
                            msvcrt.locking(
                                file.fileno(),
                                (
                                    msvcrt.LK_NBLCK
                                    if wants_exclusive
                                    else msvcrt.LK_NBRLCK
                                ),
                                1,
                            )
                            # print(f"locked {file}")
                        else:
                            fcntl.flock(
                                file.fileno(),
                                fcntl.LOCK_EX if wants_exclusive else fcntl.LOCK_SH,
                            )
                        yield file, file2
                    finally:
                        if sys.platform.startswith("win"):
                            file.seek(0)
                            msvcrt.locking(file.fileno(), msvcrt.LK_UNLCK, 1)
                            # print(f"unlocked {file}")
                        else:
                            fcntl.flock(file.fileno(), fcntl.LOCK_UN)
        except (BlockingIOError, OSError) as e:
            print(f"Error opening file {filepath}.")
            raise
            # finally:
            # 	if sys.platform.startswith('win'):
            # 		msvcrt.locking(file.fileno(), msvcrt.LK_UNLCK, 1)
            # 		print("unlocked")
            # 	else:
            # 		fcntl.flock(file.fileno(), fcntl.LOCK_UN)

    def read(self, flavor, year=None, **kwargs):
        filename = self.get_filename(flavor, year)
        try:
            with self.file_access(filename, **kwargs) as files:
                data = self.files_to_df(files, flavor)
            return data
        except Exception as e:
            print(f"Unable to load data from {filename}.")
            raise

    def json_read(self, flavor, year=None, **kwargs):
        df = self.read(flavor, year, **kwargs)
        return self.df_to_jsonable(df, flavor)

    # Applies an operation to the data in the file
    # `operation` is a function that takes a pandas DataFrame as input and returns two outputs:
    # 		a pandas DataFrame, and feedback to the function caller
    def edit(
        self,
        operation: Callable[[pd.DataFrame], tuple[pd.DataFrame, any]],
        flavor,
        year=None,
        **kwargs,
    ):
        filename = self.get_filename(flavor, year)
        try:
            with self.file_access(filename, "r+", **kwargs) as files:
                old_data = self.files_to_df(files, flavor)
                new_data, feedback = operation(old_data)
                self.df_to_files(new_data, files)
            return feedback
        except Exception as e:
            print(f"Unable to write data to {filename}.")
            raise

    def delete(self, flavor, year="test"):
        filename = self.get_filename(flavor, year)
        flavor = self.format_flavor(flavor)
        with self.file_access(filename, "w") as files:
            if flavor == "movies":
                self.df_to_files(self.DEFAULT_MOVIES, files)
            elif flavor == "nominations":
                self.df_to_files(self.DEFAULT_NOMINATIONS, files)
            else:
                raise Exception(f"Invalid type '{flavor}' for deletion.")

    # Makes sure that a table has the columns specified in a dictionary with types
    def add_columns(
        self, flavor: DataFlavor, year: str | int | None = None, columns: dict = {}
    ):
        def operation(data):
            for column, dtype in columns.items():
                if column not in data.columns:
                    data[column] = pd.Series(dtype=dtype)
            return data, None

        self.edit(operation, flavor, year)

    def get_movies(self, year, idList=None, json=False):
        data = self.read("movies", year)
        noms = self.read("nominations", year)
        data[MovieColumns.NUM_NOMS] = (
            noms.groupby(NomColumns.MOVIE).size()[data.index].fillna(0)
        )
        data = data.rename(columns={MovieColumns.RUNTIME: MovieColumns.RUNTIME_MINUTES})
        data[MovieColumns.RUNTIME_HOURS] = data[MovieColumns.RUNTIME_MINUTES].apply(
            lambda x: f"{int(x/60)}:{int(x%60):02d}" if pd.notna(x) else None
        )
        if idList:
            data = data.loc[idList]
        if json:
            return self.df_to_jsonable(data, "movies")
        return data

    # Adds a new movie to the database, or updates an existing one
    # `movie` is usually the id of the movie to update
    # If try_title_lookup, then `movie` is interpreted as the title of the movie
    # 		In that case, the id of the movie is returned (whether it was found or created)
    # `new_data` is a dictionary of new data to add or update
    def update_movie(
        self, movie, year, new_data: dict = {}, try_title_lookup=False
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
                self.validate_id(movieId, "m")
            except:
                raise (
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
                    movieId = self.create_unique_id(
                        "m", year=year, existing_ids=data.index
                    )
                    data.loc[movieId] = {MovieColumns.TITLE: movie, **new_data}
                return data, movieId

        feedback = self.edit(operation, "movies", year)
        # print(f"utils line 183, feedback={feedback}, type={type(feedback)}")
        return feedback

    def blank_test_data(self):
        self.delete("movies", year="test")
        self.delete("nominations", year="test")

    # Note: This function does not check if the nomination already exists in the database
    # 	If there's a possibliity of duplicates, you've done something wrong
    # Checks if `movie`, `category` are formatted as IDs
    # Does NOT check if they actually exist in the database
    # 	If you didn't already add/confirm them yourself, you're doing something wrong
    # If `validate` is True, the function will at least check if there are too many nominations in a category
    def add_nomination(self, year, nomination: Nom, validate=False):
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
        self.validate_id(movie, "m")
        self.validate_id(category, "c")

        def operation(data: pd.DataFrame):
            data = data._append(
                {
                    NomColumns.MOVIE: movie,
                    NomColumns.CATEGORY: category,
                    NomColumns.NOTE: note,
                },
                ignore_index=True,
            )
            return data, None

        if validate:
            bad_cats = self.validate_nomination_list(year)
            if bad_cats:
                raise Exception(
                    f"Too many nominations in these categories: {bad_cats}."
                )
        self.edit(operation, "nominations", year)

    # Checks if the database entry table_nominations.csv has the right number of entries in each category
    def validate_nomination_list(self, year, expect_full=False):
        nominations = self.read("nominations", year)
        category_counts = nominations[NomColumns.CATEGORY].value_counts()
        cat_df = self.read("c")
        expected_counts = cat_df[CategoryColumns.MAX_NOMS]
        bad_cats = []
        for category, count in category_counts.items():
            if (
                (category not in expected_counts.index)
                or (count > expected_counts[category])
                or (expect_full and count < expected_counts[category])
            ):
                bad_cats.append(category)
        return bad_cats

    def add_user(self, username, letterboxd=None, email=None):
        userIdList = self.read("users").index.tolist()

        def operation(data: pd.DataFrame):
            user_id = self.create_unique_id("users", existing_ids=userIdList)
            # while True:
            # 	user_id = create_unique_id('user')
            # 	if user_id not in userIdList:
            # 		break
            data.loc[user_id] = {
                UserColumns.NAME: username,
                UserColumns.LETTERBOXD: letterboxd,
                UserColumns.EMAIL: email,
            }
            return data, user_id

        return self.edit(operation, "users")

    def update_user(self, userId, new_data: dict):
        self.validate_id(userId, "users")

        def operation(data: pd.DataFrame):
            assert userId in data.index, f"User '{userId}' not found."
            if not all([x in data.columns for x in new_data.keys()]):
                raise Exception(f"Invalid columns in new data: {new_data.keys()}.")
            data.loc[userId, new_data.keys()] = new_data.values()
            return data, None

        return self.edit(operation, "users")

    def delete_user(self, userId):
        def operation(data: pd.DataFrame):
            data = data.drop(userId)
            return data, None

        return self.edit(operation, "users")

    # Deletes existing entry if it exists
    # returns True if the entry already existed, False if it didn't
    def add_watchlist_entry(self, year, userId, movieId, status: WatchStatus) -> bool:
        self.validate_id(userId, "users")
        self.validate_id(movieId, "movies")
        assert status in WatchStatus.__args__, f"Invalid status '{status}'."

        def operation(data: pd.DataFrame):
            existing_entry = data[
                (data[WatchlistColumns.USER] == userId)
                & (data[WatchlistColumns.MOVIE] == movieId)
            ]
            data = data.drop(existing_entry.index)

            if status != WatchStatus.BLANK:
                new_entry = pd.DataFrame(
                    {
                        WatchlistColumns.USER: userId,
                        WatchlistColumns.MOVIE: movieId,
                        WatchlistColumns.STATUS: status,
                    }
                )
                data = pd.concat([data, new_entry], ignore_index=True)
            return data, (not existing_entry.empty)

        return self.edit(operation, "watchlist", year)


if __name__ == "__main__":
    storage = StorageManager("C:/Users/lfsto/OscarFiles/backend/database")
    storage.add_watchlist_entry(
        2023,
        "usr_ca512f",
        "mov_c037c8",
        WatchStatus.SEEN,
    )
