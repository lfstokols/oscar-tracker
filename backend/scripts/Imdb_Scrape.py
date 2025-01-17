import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).parent.parent
# LOGIC_DIR = BACKEND_DIR / "logic"
sys.path.append(
    str(BACKEND_DIR)
)  # Adds the parent directory to the path for module imports
# Should be `backend/
# N.B. first .parent goes from file to directory, second
# goes to parent directory
# sys.path.append(
#     str(LOGIC_DIR)
# )  # Adds the logic directory to the path for module imports
# Fuck it, hope this works

import argparse, requests, re, os
from datetime import datetime
import pandas as pd
from backend.logic.StorageManager import StorageManager
import backend.logic.Processing as pr
import backend.logic.Mutations as mu
from backend.logic.MyTypes import *
from dotenv import load_dotenv

load_dotenv(BACKEND_DIR.parent / ".env")
try:
    IMDB_API_KEY = os.getenv("IMDB_API_KEY")
except Exception as e:
    print(f"The .env file is missing or has an error: {e}")
    raise

URL_BASE = "http://www.omdbapi.com/"

# Create base session with shared configs
BASE_SESSION = requests.Session()
BASE_SESSION.base_url = URL_BASE


def parse_args():
    parser = argparse.ArgumentParser(
        description="Attempts to find IMDB entries for movies in the database."
    )
    parser.add_argument(
        "year",
        type=int,
        help="Year to import data for. Year is when movies are released, "
        "not when the Oscars ceremony is held.",
    )
    parser.add_argument(
        "-d",
        "--dry-run",
        action="store_true",
        help="Doesn't save anything.",
    )
    # parser.add_argument('--write-test', action='store_true',
    # 				help='Saves data in a test folder.')
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
        "-c",
        "--cutoff",
        type=int,
        help="Asks for user input if there are at least this many problems with"
        " the data. Default is 2.",
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
    error_cutoff = args.cutoff or 2

    global storage
    if args.use_test:
        storage = StorageManager(BACKEND_DIR / "test_database")
    else:
        storage = StorageManager(BACKEND_DIR / "database")

    if not dry_run:
        storage.add_columns(
            "movies",
            year,
            columns={
                MovieColumns.Imdb_ID: "string",
                MovieColumns.RUNTIME: "Int64",
            },
        )

    fetch_imdb(year, error_cutoff)


def fetch_imdb(year, error_cutoff):
    movie_data = pr.get_movies(storage, year)
    for movId in movie_data.index:
        try:
            debug_print(f"Fetching data for {movId}")
            title = movie_data.loc[movId, MovieColumns.TITLE]
            response = fetch_wrapper({"t": title})
            response_dict = response.json()

            title_correct = ("Title" in response_dict) and (
                response_dict["Title"] == title
            )
            year_correct = ("Year" in response_dict) and (
                response_dict["Year"] == str(year)
            )
            awards_correct = ("Awards" in response_dict) and (
                re.match(r"^Nominated for \d+ Oscar", response_dict["Awards"]) != None
                or re.match(r"^Won \d+ Oscar", response_dict["Awards"]) != None
            )
            if (
                sum([not title_correct, not year_correct, not awards_correct])
                >= error_cutoff
            ):
                print(f"Problems with {title}.")
                if "Title" not in response_dict:
                    print("No title found.")
                elif not title_correct:
                    print(
                        f"Title mismatch: my <{title}> vs their <{response_dict['Title']}>"
                    )
                if "Year" not in response_dict:
                    print("No year found.")
                elif not year_correct:
                    print(
                        f"Year mismatch: my <{year}> vs their <{response_dict['Year']}>"
                    )
                if "Awards" not in response_dict:
                    print("No awards found.")
                elif not awards_correct:
                    print(f"Awards mismatch: {response_dict['Awards']}")

                keep = input(f"Assume it's still right movie? (y/n): ").lower() == "y"
            else:
                keep = True
            if not keep:
                continue
            new_data = {}
            if "imdbID" in response_dict:
                new_data["imdbId"] = response_dict["imdbID"]
            else:
                print(f"Missing imdbID for {title}")
            if "Runtime" in response_dict:
                new_data["runtime"] = int(
                    re.match(r"\d*", response_dict["Runtime"]).group()
                )
            else:
                print(f"Missing data for {title}")
            if not new_data:
                continue
            if not dry_run:
                mu.update_movie(storage, movId, year, new_data=new_data)
            if dry_run:
                print(f"{title}: {new_data}")
        except Exception as e:
            print(f"Error with {movId}: {e}")


def fetch_wrapper(params=None):
    """
    Returns the JSON response from the Imdb API (a dict).
    endpoint: everything after /3/, no leading/trailing slashes.
    """
    # Use the session but customize for this specific request
    response = BASE_SESSION.get(
        f"{BASE_SESSION.base_url}",
        params={"apikey": "b96f294f", "type": "movie", "y": year, **params},
        headers=headers,
    )
    return response.json()


# url = "http://www.omdbapi.com/"  # ?apikey=b96f294f&y={year}&type=movie&t=
# base_params = {"apikey": "b96f294f", "y": year, "type": "movie"}
# response = requests.get(url, params={**base_params, "t": title})


def debug_print(message):
    if verbose:
        print("LOG: " + str(message))


if __name__ == "__main__":
    main()
