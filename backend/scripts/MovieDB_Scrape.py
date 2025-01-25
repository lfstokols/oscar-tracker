import sys
from pathlib import Path
import argparse, requests, re, os
from datetime import datetime
from typing import Optional
import pandas as pd

PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.append(
    str(PROJECT_ROOT)
)  # Adds the parent directory to the path for module imports
import backend.utils.env_reader as env
from backend.types.my_types import *
from backend.logic.storage_manager import StorageManager
import backend.logic.Processing as pr
import backend.logic.Mutations as mu

TMDB_API_KEY = env.TMDB_API_KEY
Database_Path = env.DATABASE_PATH

URL_BASE = "https://api.themoviedb.org/3/"

# Create base session with shared configs
BASE_SESSION = requests.Session()
BASE_SESSION.headers.update(
    {"Authorization": f"Bearer {TMDB_API_KEY}", "accept": "application/json"}
)


def parse_args():
    parser = argparse.ArgumentParser(description="Attempts to scrape TMDB data.")
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
    if args.test:
        storage = StorageManager(Database_Path.parent / "test_database")
    else:
        storage = StorageManager(Database_Path)

    if not dry_run:
        storage.add_columns(
            "movies",
            year,
            columns={
                MovieColumns.MovieDB_ID: "string",
                MovieColumns.RUNTIME: "Int64",
                MovieColumns.POSTER_PATH: "string",
            },
        )

    fetch_movie_db(year, error_cutoff)


def fetch_movie_db(year, error_cutoff):

    movie_data = pr.get_movies(storage, year)
    for movId in movie_data.index:
        try:
            debug_print(f"Fetching data for {movId}")
            movie = movie_data.loc[movId].to_dict()
            movie["id"] = movId

            movie_db_id = try_to_find_moviedb_id(movie, year)
            if movie_db_id is None:
                continue
        except Exception as e:
            debug_print(f"Error searching for {movId}: {e}")
            continue
        try:
            details = fetch_wrapper(f"movie/{movie_db_id}")
            title = details["title"]
            runtime = details["runtime"]
            is_short = movie[DerivedMovieColumns.IS_SHORT]
            release_status = details["status"]
            release_date = details["release_date"]

            title_correct = ("title" in details) and (details["title"] == title)
            year_correct = "release_date" in details and (release_date[:4] == str(year))
            runtime_correct = "runtime" in details and (
                (runtime > 80 and not is_short) or (runtime < 60 and is_short)
            )
            release_status_correct = "status" in details and (
                release_status == "Released"
            )
            odd_tags = details["adult"] or details["video"]
            if (
                sum(
                    [
                        not title_correct,
                        not year_correct,
                        not runtime_correct,
                        not release_status_correct,
                        odd_tags,
                    ]
                )
                >= error_cutoff
            ):
                print(f"Problems with {title}.")
                if "title" not in details:
                    print("No title found.")
                elif not title_correct:
                    print(f"Title mismatch: my <{title}> vs their <{details['title']}>")
                if "release_date" not in details:
                    print("No year found.")
                elif not year_correct:
                    print(
                        f"Year mismatch: my <{year}> vs their <{details['release_date'][:4]}>"
                    )
                if "runtime" not in details:
                    print("No runtime found.")
                elif not runtime_correct:
                    print(
                        f"Runtime odd: they say <{details['runtime']}> and movie {'IS' if is_short else 'is NOT'} supposed to be a short"
                    )
                if "status" not in details:
                    print("No release status found.")
                elif not release_status_correct:
                    print(
                        f"Release status odd: they say the release status is <{details['status']}>"
                    )
                if odd_tags:
                    tags: list[str] = []
                    if details["adult"]:
                        tags.append("adult")
                    if details["video"]:
                        tags.append("video")
                    print(f"The movie was tagged as <{', '.join(tags)}>")
                print(
                    "\nAdditional info:",
                    f"Release date: <{details['release_date']}>",
                    f"Language: <{details['original_language']}>",
                    f"Country: <{details['origin_country']}>",
                    f"Genres: <{', '.join([g['name'] for g in details['genres']])}>",
                )

                keep = input(f"Assume it's still right movie? (y/N): ").lower() == "y"
            else:
                keep = True
            if not keep:
                continue
            new_data: dict[str, int] = {
                MovieColumns.MovieDB_ID: movie_db_id,
            }
            if details["imdb_id"]:
                new_data[MovieColumns.Imdb_ID] = details["imdb_id"]
            else:
                debug_print(f"Missing Imdb ID for {title}")
            if details["runtime"] and details["runtime"] > 0:
                new_data[MovieColumns.RUNTIME] = details["runtime"]
            if details["poster_path"]:
                new_data[MovieColumns.POSTER_PATH] = details["poster_path"]

            if not dry_run:
                mu.update_movie(storage, movId, year, new_data=new_data)
            if dry_run:
                print(f"{title}: {new_data}")
        except Exception as e:
            print(f"Error with {movId}: {e}")
            raise e


def try_to_find_moviedb_id(movie, year) -> Optional[int]:
    movId = movie[MovieColumns.ID]
    debug_print(f"Fetching data for {movId}")
    title = movie[MovieColumns.TITLE]
    assert title is not None
    debug_print(f"Title: {title}")
    if not pd.isna(movie[MovieColumns.MovieDB_ID]):
        debug_print(f"Already have a MovieDB ID for {movId} <{title}>")
        return None
    if not pd.isna(movie[MovieColumns.Imdb_ID]):
        # use_Imdb = not (input("Fetch from Imdb ID? (Y/n)").lower() == "n")
        # if use_Imdb:
        Imdb_id = movie[MovieColumns.Imdb_ID]
        result = fetch_from_Imdb_id(Imdb_id)
        if result is None:
            debug_print(
                f"Movie {movId} has Imdb ID set as {Imdb_id}, but no results found. The ID might be invalid."
            )
        return result
    else:
        params = {"query": title, "year": year}
        result = fetch_wrapper(endpoint="search/movie", params=params)
        if len(result["results"]) > 0:
            return result["results"][0]["id"]
        else:
            debug_print(f"No search results found for {title} in {year}")
            return None


def fetch_from_Imdb_id(imdb_id):
    endpoint = f"find/{imdb_id}"
    params = {"external_source": "imdb_id"}
    result = fetch_wrapper(endpoint, params=params)
    if len(result["movie_results"]) == 0:
        return None
    return result["movie_results"][0]["id"]


def fetch_wrapper(endpoint, params=None, headers=None):
    """
    Returns the JSON response from the movieDB API (a dict).
    endpoint: everything after /3/, no leading/trailing slashes.
    """
    # * Use the session but customize for this specific request
    response = BASE_SESSION.get(
        f"{URL_BASE}/{endpoint}", params=params, headers=headers
    )
    return response.json()


def debug_print(message):
    if verbose:
        print("LOG: " + str(message))


if __name__ == "__main__":
    main()
