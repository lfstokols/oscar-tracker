from datetime import datetime
import logging
import pandas as pd
from backend.logic.storage_manager import StorageManager
from backend.types.my_types import *
from backend.types.api_schemas import MovieID, UserID
import requests
from bs4 import BeautifulSoup
import os, pathlib
import backend.logic.Mutations as mu
from backend.types.api_validators import (
    AnnotatedValidator,
    MovieValidator,
    UserValidator,
)


def update_user_watchlist(user_id: UserID) -> bool:
    """
    For a given user, check their letterboxd rss for relevant movies
    and update their watchlist.
    Also updates the last_check timestamp to only check for new movies.

    Returns: True if new movies were found, False otherwise.
    """
    storage = StorageManager.get_storage()
    current_year = datetime.now().year - 1
    idlist = get_movie_list_from_rss(user_id, current_year)
    # * add to watchlist
    for id in idlist:
        logging.debug(f"Adding {id} to watchlist for {user_id}")
        mu.add_watchlist_entry(
            storage, current_year, user_id, id, WatchStatus(WatchStatus.SEEN)
        )
    if len(idlist) > 0:
        return True
    return False


def get_moviedb_ids_from_rss(
    storage: StorageManager,
    account: UserID,
    cutoff: pd.Timestamp = pd.Timestamp.min,
) -> list[MovieDbID]:
    account = storage.read("users").at[account, UserColumns.LETTERBOXD]
    soup = fetch_rss(account)
    return parse_rss(soup, cutoff)


def fetch_rss(account: str) -> BeautifulSoup:
    response = requests.get(f"https://letterboxd.com/{account}/rss")
    # * Uncomment for debugging
    # with open(
    #     pathlib.Path(__file__).parent.parent.parent / "fyi" / "rss_debug.xml",
    #     "w",
    #     encoding="utf-8",
    # ) as f:
    #     f.write(response.text)
    soup = BeautifulSoup(response.text, "lxml-xml")
    return soup


def parse_rss(
    soup: BeautifulSoup, cutoff: pd.Timestamp = pd.Timestamp.min
) -> list[MovieDbID]:
    items = soup.find_all("item")
    movie_ids = []
    for item in items:
        pubDate = pd.Timestamp(item.find("pubDate").text).tz_convert("UTC")
        # if pubDate < pd.Timestamp(cutoff):
        #     break
        movie_id_block = item.find("tmdb:movieId")
        if movie_id_block is None:
            continue
        movie_id = movie_id_block.text
        movie_ids.append(int(movie_id))
    return movie_ids


def get_movie_list_from_rss(user_id: UserID, year: int) -> list[MovieID]:
    """
    For a given user, check their letterboxd rss for relevant movies
    and return a list of movies.

    Returns: A list of movies ids (e.g. mov_123aef).
    """
    storage = StorageManager.get_storage()
    # * compute parameters
    account = storage.read("users").at[user_id, UserColumns.LETTERBOXD.value]
    cutoff = mu.get_and_set_rss_timestamp(user_id)
    # * fetch the data
    soup = fetch_rss(account)
    idlist = parse_rss(soup, cutoff)
    # * identify the movies
    movies = storage.read("movies", year=year)
    t_to_me = pd.Series(movies.index, index=movies[MovieColumns.MovieDB_ID.value])
    idlist = t_to_me[t_to_me.index.isin(idlist)]
    validated_idlist = []
    for id in idlist:
        try:
            validated_idlist.append(MovieValidator(movie=id).movie)
        except:
            logging.warning(f"Invalid movie id: {id}")

    return validated_idlist
