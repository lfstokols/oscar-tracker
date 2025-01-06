import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).parent.parent
LOGIC_DIR = BACKEND_DIR / "logic"
sys.path.append(
    str(BACKEND_DIR)
)  # Adds the parent directory to the path for module imports
# Should be backend/
# N.B. first .parent goes from file to directory, second goes to parent directory
sys.path.append(
    str(LOGIC_DIR)
)  # Adds the logic directory to the path for module imports
# Fuck it, hope this works

import argparse
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from backend.logic.StorageManager import StorageManager
from backend.logic.MyTypes import *
import re
import csv
import pandas as pd

# category_df = None
category_list: list[CatID] = []


def main():
    parser = argparse.ArgumentParser(
        description="Attempts to parse nomination data from Wikipedia."
    )
    parser.add_argument(
        "year",
        type=int,
        help="Year to import data for. Year is when movies are released, not when the Oscars ceremony is held.",
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="Saves data in a test folder."
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Deletes existing data before adding new entries.",
    )
    parser.add_argument(
        "--verbose", action="store_true", help="Prints additional information."
    )
    args = parser.parse_args()

    year = args.year
    dry_run = args.dry_run
    overwrite = args.overwrite
    global verbose
    verbose = args.verbose

    global storage
    storage = StorageManager(BACKEND_DIR / "database")
    global storage_year
    storage_year = str(year)
    if dry_run:
        storage_year = "test"
        storage.blank_test_data()
    storage.add_columns("movies", storage_year, columns={"title": str})

    global category_df
    global category_list
    category_df = storage.read("categories")
    # category_df.set_index('id', inplace=True)
    category_df = category_df.astype({"isShort": bool, "hasNote": bool})

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

    tables = soup.find_all("table")
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
        table = section_head.find_next("table")
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
    with open(BACKEND_DIR.parent / "fyi" / "scrape.txt", "w", encoding="utf-8") as file:
        file.write(str(__file__) + " @ " + str(datetime.now()) + "\n\n")
        for item in data_list:
            file.write(item)
            file.write("\n\n")
    debug_print("Data written to file")

    return data_list


def parse_data(data_list):
    # Parse text into lines
    nominations_raw = {}
    for item in data_list:
        lines = [line.strip() for line in item.split("\n") if line.strip()]
        category = re.match(r"^[a-zA-Z ]*", lines[0]).group().strip()
        if category not in category_df["fullName"].tolist():
            print(f"Header {category} is not in the category list.")
            key = "cat_" + input("Please enter the category ID: cat_")
            if key not in category_list:
                raise Exception(f"Invalid category ID '{key}'.")
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

    # Parse values from lines, with regex
    dash_pattern = r"[\u2010-\u2015\u2043\u2212\-]"  # represents a dash, but allowing for various dash-like unicode characters
    for category in category_list:
        for line in nominations_raw[category]:
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
                category_df.loc[category, "grouping"] == "Acting"
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
                title = re.match(pattern, line).group(group_num).strip()
                assert not too_many_dashes
            except Exception as e:
                print(f">\tUnable to parse title for {category}::{line}")
                print(f">\tBest guess is <{title}>. Leave blank to use guess.")
                title = input("\t>>Please enter the TITLE manually: ").strip() or title
            if category_df.loc[category, "hasNote"]:
                try:
                    note = (
                        re.match(pattern, line).group(3 - group_num).strip()
                    )  # 3 - group_num is 2 if group_num is 1, and vice versa
                    assert not too_many_dashes
                except Exception as e:
                    print(f">\tUnable to parse note for {category}::{line}")
                    print(f">\tBest guess is <{note}>. Leave blank to use guess.")
                    note = (
                        input("\t>>Please enter the NOTE manually: ").strip() or title
                    )
            movie_id = get_movie_id(title)
            # print(f"line 151, movie_id={movie_id}, type={type(movie_id)}")
            nom = {"movie": movie_id, "category": category, "note": note}
            storage.add_nomination(storage_year, nom, validate=True)

    if verbose:
        lengths = storage.read("n", storage_year)["category"].value_counts().to_dict()
        debug_print(f"Parsed nomination dictionary created: {lengths.items()}")
    debug_print(f"Found {len(storage.read('m', storage_year))} movies.")


def debug_print(message):
    if verbose:
        print("LOG: " + str(message))


def get_movie_id(
    title: str,
) -> MovID:  # Returns the id if it exists, otherwise creates one and adds to table
    return storage.update_movie(title.strip(), storage_year, try_title_lookup=True)


if __name__ == "__main__":
    main()
