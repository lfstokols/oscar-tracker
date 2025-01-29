import sys
from pathlib import Path
import argparse, requests, re, os
from datetime import datetime
from typing import Optional
import pandas as pd
from bs4 import BeautifulSoup, Tag
import pandas as pd

# * local imports
PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.append(str(PROJECT_ROOT))
os.environ["ROOT_DIR"] = str(PROJECT_ROOT)
import backend.utils.env_reader as env
from backend.types.my_types import *
from backend.types.api_schemas import MovieID
from backend.logic.storage_manager import StorageManager
import backend.logic.Processing as pr
import backend.logic.Mutations as mu

Database_Path = env.DATABASE_PATH


def parse_args():
    parser = argparse.ArgumentParser(
        description="Attempts to parse nomination data from Wikipedia."
    )
    parser.add_argument(
        "year",
        type=int,
        help="Year to import data for. Year is when movies are released, not when the Oscars ceremony is held.",
    )
    parser.add_argument(
        "-d",
        "--dry-run",
        action="store_true",
        help="Doesn't save anything.",
    )
    parser.add_argument(
        "-t",
        "--test",
        action="store_true",
        help="Uses movie data from test folder. Also saves to test folder, unless dry-run.",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Prints additional information.",
    )
    parser.add_argument(
        "-s",
        "--save-text",
        action="store_true",
        help="Saves the raw text scraped from Wikipedia to a file, for help debugging the regex when the syntax inevitably changes.",
    )
    return parser.parse_args()


def main():
    args = parse_args()

    global year
    year = args.year
    global dry_run
    dry_run = args.dry_run
    global verbose
    verbose = args.verbose
    global save_text
    save_text = args.save_text

    global storage
    if args.test:
        storage = StorageManager(Database_Path.parent / "test_database")
    else:
        storage = StorageManager(Database_Path)

    debug_print(f"Storage directory: {storage.dir}")

    if not dry_run:
        storage.add_columns(
            "movies",
            year,
            columns={MovieColumns.TITLE: "string"},
        )

    global category_df
    global category_list
    category_df = storage.read("categories")
    category_list = category_df.index.tolist()

    data_list = fetch_wikipedia(year)
    parse_data(data_list)


def fetch_wikipedia(year):
    ceremony_num = year - 1927
    ordinal_name = (
        f"{ceremony_num}th"
        if 11 <= ceremony_num % 100 <= 13
        else str(ceremony_num)
        + {1: "st", 2: "nd", 3: "rd"}.get(ceremony_num % 10, "th")
    )
    url = f"https://en.wikipedia.org/wiki/{ordinal_name}_Academy_Awards"
    debug_print(f"Fetching data from {url}")
    response = requests.get(url)
    soup = BeautifulSoup(response.content, "html.parser")

    is_current = datetime.now() < datetime(
        year, 4, 1
    )  # Check if the Oscars ceremony has happened yet. Not super accurate, but good enough for our purposes.
    debug_print("Year is current" if is_current else "Year is in the past")
    section_id = (
        "Nominations" if is_current else "Awards"
    )  # The section of the page where the data is located
    debug_print(f"Looking for section with id {section_id}")
    try:
        section_head = soup.find(id=section_id)
        assert section_head is not None
        table: Optional[Tag] = section_head.find_next(name="table")  # type: ignore
    except Exception as e:
        debug_print(f"Error finding table: {e}")
        table = None
    if table:
        cells = table.find_all("td")
        data_list = [cell.get_text() for cell in cells]
    else:
        debug_print("No table found")
        return

    # Write data to file
    if save_text:
        with open(PROJECT_ROOT / "fyi" / "scrape.txt", "w", encoding="utf-8") as file:
            file.write(str(__file__) + " @ " + str(datetime.now()) + "\n\n")
            for item in data_list:
                file.write(item)
                file.write("\n\n")
        debug_print("Data written to file")

    return data_list


def parse_data(data_list):
    # * Parse text into lines
    nominations_raw = {}
    for item in data_list:
        lines = [line.strip() for line in item.split("\n") if line.strip()]
        category_attempt = re.match(r"^[a-zA-Z ]*", lines[0])
        is_problem = False
        if category_attempt == None:
            print(f"Unable to parse category for {lines[0]}")
            is_problem = True
        else:
            category = category_attempt.group().strip()
            if category not in category_df["fullName"].tolist():
                print(f"Header {category} is not in the category list.")
                is_problem = True
        if is_problem:
            while True:
                key = "cat_" + input("Please enter the category ID: cat_")
                if key not in category_list:
                    print(f"Invalid category ID '{key}'.")
                else:
                    break
        else:
            key = category_df.loc[category_df["fullName"] == category].index[0]
        value = lines[1:]
        nominations_raw[key] = value
    if verbose:
        lengths = {key: len(value) for key, value in nominations_raw.items()}
        debug_print(f"Raw nomination dictionary created: {lengths}")

    debug_print(
        "Extra entries are: "
        + str(set(list(nominations_raw.keys())) - set(category_list))
    )

    # debug_print(nominations_raw["Best Picture"])

    # * Parse values from lines, with regex
    dash_pattern = r"[\u2010-\u2015\u2043\u2212\-]"  # * represents a dash, but allowing for various dash-like unicode characters
    for category, lines in nominations_raw.items():
        for line in lines:
            if category == "cat_song":
                pattern = rf'^"(.*)" from (.*) {dash_pattern} '
                group_num = 2
            elif category == "cat_frgn":
                pattern = rf"^(.*) \((.*)\)"
                group_num = 1
            elif category == "cat_dirc":
                pattern = rf"^(.*) {dash_pattern} ([^\n\u2020-\u2021\[]*)"
                group_num = 2
            elif (
                category_df.loc[category, "grouping"] == "acting"
            ):  # in ["Best Actor", "Best Actress", "Best Supporting Actor", "Best Supporting Actress"]:
                pattern = rf"^(.*) {dash_pattern} (.*) as"
                group_num = 2
            else:
                pattern = rf"^(.*) {dash_pattern}"
                group_num = 1

            title = None
            note = None
            too_many_dashes = len(re.findall(f" {dash_pattern} ", line)) != 1
            try:
                match = re.match(pattern, line)
                if not match:
                    raise ValueError(f"No match found for pattern: {pattern}")
                title = match.group(group_num).strip()
                assert not too_many_dashes
            except Exception as e:
                print(f">\tUnable to parse title for {category}::{line}")
                if isinstance(e, AssertionError):
                    print(f">\tBest guess is <{title}>. Leave blank to use guess.")
                    title = (
                        input("\t>>Please enter the TITLE manually: ").strip() or title
                    )
                else:
                    while True:
                        title = input("\t>>Please enter the TITLE manually: ").strip()
                        if title:
                            break
                        else:
                            print(f"Title cannot be empty.")
            if category_df.loc[category, "hasNote"]:
                try:
                    match = re.match(pattern, line)
                    if not match:
                        raise ValueError(f"No match found for pattern: {pattern}")
                    note = match.group(
                        3 - group_num
                    ).strip()  # * 3-group_num is 2 if group_num is 1, and vice versa
                    assert not too_many_dashes
                except Exception as e:
                    print(f">\tUnable to parse note for {category}::{line}")
                    if isinstance(e, AssertionError):
                        print(f">\tBest guess is <{note}>. Leave blank to use guess.")
                        note = (
                            input("\t>>Please enter the NOTE manually: ").strip()
                            or note
                        )
                    else:
                        while True:
                            note = input("\t>>Please enter the NOTE manually: ").strip()
                            if note:
                                break
                            else:
                                print(f"Note cannot be empty.")
            if not type(title) == str:
                print(f"Invalid title '{title}' for {category}.")
                continue
            # * Check if the movie exists, and if not, add it
            if dry_run:
                movie_id = None
                if does_movie_exist(title):
                    movie_id = get_movie_id(title)
                print(f"{title}<{movie_id}>, category: {category}, note: {note}")
            else:
                if does_movie_exist(title):
                    movie_id = get_movie_id(title)
                else:
                    movie_id = mu.add_movie(storage, year, title)
                nom = {
                    NomColumns.MOVIE: movie_id,
                    NomColumns.CATEGORY: category,
                    NomColumns.NOTE: note,
                }
                nom = Nom(**nom)
                mu.add_nomination(storage, year, nom, validate=False)

    if verbose:
        lengths = (
            storage.read("nominations", year)[NomColumns.CATEGORY]
            .value_counts()
            .to_dict()
        )
        debug_print(f"Parsed nomination dictionary created: {lengths.items()}")
    debug_print(f"Found {len(storage.read('movies', year))} movies.")


def debug_print(message):
    if verbose:
        print("LOG: " + str(message))


def does_movie_exist(title: str) -> bool:
    titleList = storage.read("movies", year)[MovieColumns.TITLE]
    return title in titleList.values


def get_movie_id(
    title: str,
) -> MovieID:
    movies = storage.read("movies", year)
    titleList = pd.Series(movies.index, index=movies[MovieColumns.TITLE])
    return titleList.at[title]


if __name__ == "__main__":
    main()
