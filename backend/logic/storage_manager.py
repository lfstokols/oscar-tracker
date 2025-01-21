from time import sleep
import random
from pathlib import Path
import pandas as pd
import sys
import re
from contextlib import contextmanager

from backend.data_management.api_schemas import Flavor
from backend.data_management.api_validators import AnnotatedValidator

from collections.abc import Callable
from backend.logic.MyTypes import *
from typing import IO, Any, TYPE_CHECKING, cast
import backend.logic.Flavors as flv
from backend.data_management.api_schemas import *

IS_WINDOWS = sys.platform.startswith("win")
if IS_WINDOWS:
    from backend.logic.locking_modules.windows_locking import lock_file, unlock_file
else:
    from backend.logic.locking_modules.unix_locking import lock_file, unlock_file

# import backend.logic.utils as utils


# TODO - Create a DataTable class with attributes like flavor, year, and filename
# TODO      This class computes the filename and flavor_props, and they're what StorageManager returns
# TODO      It can also abstract away the changes to the attributes. Only it knows what the attributes are stored as, everything else only sees the derived values
class StorageManager:

    _instance = None

    @classmethod
    def get_storage(cls):
        if cls._instance is None:
            raise ValueError("Storage not initialized")
        return cls._instance

    @classmethod
    def make_storage(cls, database_directory):
        if cls._instance is not None:
            raise ValueError("Storage already exists")
        cls._instance = cls(database_directory)
        return cls._instance

    def __init__(self, database_directory):
        self.dir = Path(database_directory)
        self.should_retry = True
        self.retry_interval = 30  # ms
        self.max_retries = 10

        # Default dataframes for file creation
        self.DEFAULT_MOVIES = pd.DataFrame(
            columns=[col for col in list(MovieColumns)]
        ).set_index(MovieColumns.ID)
        self.DEFAULT_MOVIES.astype(
            {
                MovieColumns.TITLE: "string",
                MovieColumns.Imdb_ID: "string",
                MovieColumns.RUNTIME: "Int64",
            }
        )
        self.DEFAULT_NOMINATIONS = pd.DataFrame(
            columns=[col for col in list(NomColumns)]
        )
        self.DEFAULT_NOMINATIONS.astype(
            {
                NomColumns.MOVIE: "string",
                NomColumns.CATEGORY: "string",
                NomColumns.NOTE: "string",
            }
        )
        self.DEFAULT_USERS = pd.DataFrame(
            columns=[col for col in list(UserColumns)]
        ).set_index(UserColumns.ID)
        self.DEFAULT_USERS.astype(
            {
                UserColumns.NAME: "string",
                UserColumns.LETTERBOXD: "string",
                UserColumns.EMAIL: "string",
            }
        )
        self.DEFAULT_CATEGORIES = pd.DataFrame(
            columns=[col for col in list(CategoryColumns)]
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
            columns=[col for col in list(WatchlistColumns)]
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
    def create_unique_movie_id(self, year: int | str) -> MovieID:
        existing_ids = self.read("movies", year).index
        tries = 0
        while tries < 100:
            id = (
                "mov_"
                + (f"{(int(year)-1927)%256:02x}" if str(year).isdigit() else "00")
                + f"{random.randint(0, 0xFF_FF):04x}"
            )
            if id not in existing_ids:
                AnnotatedValidator(movie=id)
                validated_id: MovieID = id
                return validated_id
            tries += 1
        raise Exception(
            "Unable to create unique ID. Erroring out to avoid infinite loop."
        )

    def create_unique_user_id(self) -> UserID:
        existing_ids = self.read("users").index
        tries = 0
        while tries < 100:
            id = "usr_" + f"{random.randint(0, 0xFFF_FFF):06x}"
            if id not in existing_ids:
                AnnotatedValidator(user=id)
                validated_id: UserID = id
                return validated_id
            tries += 1
        raise Exception(
            "Unable to create unique ID. Erroring out to avoid infinite loop."
        )

    # ! deprecated
    # def create_unique_id(
    #     self, flavor: DataFlavor, existing_ids, year=None
    # ) -> MovID | UserID:
    #     flavor = flv.format_flavor(flavor)
    #     assert (
    #         flv.flavor_props(flavor)["shape"] == "entity"
    #     ), f"Flavor '{flavor}' doesn't have IDs."
    #     assert (
    #         flavor != "categories"
    #     ), "Category IDs are static. You can't create new ones."
    #     if flv.flavor_props(flavor)["annual"]:
    #         assert year is not None
    #     try:
    #         id_prefix = {"movies": "mov_", "users": "usr_"}[flavor]
    #     except:
    #         raise Exception("Invalid type. Must be 'movie' or 'user'.")

    #     tries = 0
    #     while tries < 100:
    #         if flavor == "movies":
    #             first_digits = f"{(year-1927)%256:02x}" if str(year).isdigit() else "00"
    #         else:
    #             first_digits = f"{random.randint(0, 0xFF):02x}"
    #         id = id_prefix + first_digits + f"{random.randint(0, 0xFFFF):04x}"
    #         if id not in existing_ids:
    #             return id
    #         tries += 1
    #     raise Exception(
    #         "Unable to create unique ID. Erroring out to avoid infinite loop."
    #     )

    # Returns the filenames for the data of a certain flavor and year
    # Value is tuple, (.csv, .json)
    def get_filename(self, flavor: GeneralDataFlavor, year=None) -> tuple[Path, Path]:
        # Format inputs
        flavor = flv.format_flavor(flavor)

        is_annual = flv.flavor_props(flavor)["annual"]
        if is_annual:
            assert year is not None
        year = str(year)
        # Create filename
        filename = self.dir
        if is_annual:
            filename = filename / year
        filenames = filename / f"table_{flavor}.csv", filename / f"table_{flavor}.json"
        return filenames

    # Checks if an ID is valid for a certain flavor
    def validate_id(self, id: str, flavor: DataFlavor):
        if flavor:
            flavor = flv.format_flavor(flavor)
        # else:
        #     flavor = flv.format_flavor(id[:2])
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
        for flavor in flv.flavor_list:
            if flavor in file.name:
                return flavor
        raise Exception(f"File {file} does not correspond to a known flavor.")

    def files_to_df(self, files, flavor: DataFlavor) -> pd.DataFrame:
        flavor_props = flv.flavor_props(flavor)
        tfile, jfile = files
        data = pd.read_csv(tfile)  # , na_values='NaN')
        dtypes = pd.read_json(jfile, typ="series")
        data = data.astype(dtypes)
        if flavor_props["shape"] == "entity":
            assert (
                MovieColumns.ID == "id"
                and UserColumns.ID == "id"
                and CategoryColumns.ID == "id"
            ), f"The index field must always be called 'id'. \nCurrently: MovieColumns.ID = {MovieColumns.ID}, UserColumns.ID = {UserColumns.ID}, CategoryColumns.ID = {CategoryColumns.ID}"
            #! This hardcodes that the index field must be called 'id'
            data.set_index("id", inplace=True)
        return data

    def df_to_files(self, data: pd.DataFrame, files) -> None:
        tfile, jfile = files
        for file in files:
            file.seek(0)
            file.truncate()
        flavor = self.flavor_from_file(tfile)
        index = flv.flavor_props(flavor)["shape"] == "entity"
        if index:
            data.index.name = "id"
        data.to_csv(tfile, index=index, lineterminator="\n")
        data.dtypes.apply(str).to_json(jfile)

    @contextmanager
    def file_access(self, filepath: tuple[Path, Path], mode="r", **kwargs):
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
            filepath[0].parent.mkdir(parents=True, exist_ok=True)
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
                        lock_file(file, wants_exclusive)
                        yield file, file2
                    finally:
                        unlock_file(file)
        except (BlockingIOError, OSError) as e:
            print(f"Error opening file {filepath[0].name}.")
            raise
            # finally:
            # 	if sys.platform.startswith('win'):
            # 		msvcrt.locking(file.fileno(), msvcrt.LK_UNLCK, 1)
            # 		print("unlocked")
            # 	else:
            # 		fcntl.flock(file.fileno(), fcntl.LOCK_UN)

    def retry_file_access(
        self,
        filepath: tuple[Path, Path],
        mode,
        operation: Callable[[tuple[IO[Any], IO[Any]]], Any],
        **kwargs,
    ):
        """
        Wraps a function to retry file access if the file is locked.
        `operation` is a function that takes a tuple of file objects as input and returns the output of the operation.
        should_retry is a boolean that determines if the function should retry if the file is locked.
        retry_interval is the time to wait between retries in milliseconds.
        max_retries is the maximum number of retries.
        """
        should_retry = kwargs.get("should_retry", self.should_retry)
        max_retries = kwargs.get("max_retries", self.max_retries)
        retry_interval = kwargs.get("retry_interval", self.retry_interval)
        for i in range(max_retries):
            try:
                with self.file_access(filepath, mode) as files:
                    output = operation(files)
                return output
            except OSError as e:
                if e.errno == 13 and should_retry:
                    print(f"File {filepath[0].name} is locked. Retrying...")
                    sleep(retry_interval / 1000)
                else:
                    raise
        print(
            f"Unable to open file {filepath[0].name} after {self.max_retries} retries."
        )
        raise OSError(13, "File is locked, please try again later")

    def read(self, flavor: DataFlavor, year=None, **kwargs) -> pd.DataFrame:
        filename = self.get_filename(flavor, year)
        return self.retry_file_access(
            filename, "r", lambda files: self.files_to_df(files, flavor), **kwargs
        )

    # Applies an operation to the data in the file
    # `operation` is a function that takes a pandas DataFrame as input and returns two outputs:
    # 		a pandas DataFrame, and feedback to the function caller
    def edit(
        self,
        operation: Callable[[pd.DataFrame], tuple[pd.DataFrame, Any]],
        flavor: DataFlavor,
        year: int | str | None = None,
        **kwargs,
    ):
        filename = self.get_filename(flavor, year)

        def full_operation(files):
            old_data = self.files_to_df(files, flavor)
            new_data, feedback = operation(old_data)
            self.df_to_files(new_data, files)
            return feedback

        return self.retry_file_access(filename, "r+", full_operation, **kwargs)
        # try:
        #     with self.file_access(filename, "r+") as files:
        #         old_data = self.files_to_df(files, flavor)
        #         new_data, feedback = operation(old_data)
        #         self.df_to_files(new_data, files)
        #     return feedback
        # except Exception as e:
        #     print(f"Unable to write data to {filename}.")
        #     raise

    def delete_file(self, flavor, year="test"):
        filename = self.get_filename(flavor, year)
        flavor = flv.format_flavor(flavor)
        with self.file_access(filename, "w") as files:
            if flavor == "movies":
                self.df_to_files(self.DEFAULT_MOVIES, files)
            elif flavor == "nominations":
                self.df_to_files(self.DEFAULT_NOMINATIONS, files)
            elif flavor == "watchlist":
                self.df_to_files(self.DEFAULT_WATCHLIST, files)
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

    def blank_test_data(self, year: str | int | None = None):
        assert self.dir.name == "test_database"
        self.delete_file("movies", year=str(year))
        self.delete_file("nominations", year=str(year))
        self.delete_file("watchlist", year=str(year))

    # Checks if the database entry table_nominations.csv has the right number of entries in each category
    def validate_nomination_list(self, year, expect_full=False):
        nominations = self.read("nominations", year)
        category_counts = nominations[NomColumns.CATEGORY].value_counts()
        cat_df = self.read("categories")
        expected_counts = cat_df[CategoryColumns.MAX_NOMS].astype("Int64")
        bad_cats = []
        for category, count in category_counts.items():
            if (
                (category not in expected_counts.index)
                or (count > expected_counts.at[category])
                or (expect_full and count < expected_counts.at[category])
            ):
                bad_cats.append(category)
        return bad_cats


if __name__ == "__main__":
    storage = StorageManager("C:/Users/lfsto/OscarFiles/backend/database")
    print(storage.read("users"))
