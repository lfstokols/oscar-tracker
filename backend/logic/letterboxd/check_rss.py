import logging
from datetime import datetime

import httpx
import pandas as pd
from bs4 import BeautifulSoup

import backend.logic.Mutations as mu
from backend.logic.storage_manager import StorageManager
from backend.types.api_schemas import MovieID, UserID
from backend.types.my_types import *


async def update_user_watchlist(user_id: UserID) -> bool:
    """
    For a given user, check their letterboxd rss for relevant movies
    and update their watchlist.
    Also updates the last_check timestamp to only check for new movies.

    Returns: True if new movies were found, False otherwise.
    """
    logging.info(f"Checking letterboxd rss feed for user {user_id}")
    storage = StorageManager.get_storage()
    # * compute parameters
    account = storage.read("users").at[user_id, UserColumns.LETTERBOXD]
    cutoff = mu.get_and_set_rss_timestamp(user_id)
    if cutoff is None:
        logging.debug("cutoff was None in check_rss.update_user_watchlist")
        cutoff = pd.Timestamp.now(tz="UTC") - pd.Timedelta(weeks=52)
    # * fetch the data
    soup = await fetch_rss(account)
    raw_idlist: list[MovieDbID] = parse_rss(soup, cutoff)
    # * identify the movies
    movies = storage.read("movies")
    t_to_me = pd.Series(movies.index, index=movies["alternate_id_column"])
    idlist: pd.Series[MovieID] = t_to_me[t_to_me.index.isin(
        raw_idlist)].astype(MovieID)
    # * add to watchlist
    logging.info(
        f"Adding {len(idlist)} movies to watchlist for user {user_id}")
    current_year = (
        datetime.now().year - 1
    )  # * while the system is live, the movies are from last year
    for id in idlist:
        mu.add_watchlist_entry(
            storage, current_year, user_id, id, WatchStatus(WatchStatus.SEEN)
        )
    if len(raw_idlist) > 0:
        return True
    return False


async def fetch_rss(account: str) -> BeautifulSoup:
    async with httpx.AsyncClient() as client:
        response = await client.get(f"https://letterboxd.com/{account}/rss")
    _ = response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    return soup


def parse_rss(soup: BeautifulSoup, cutoff: pd.Timestamp) -> list[MovieDbID]:
    items = soup.find_all("item")
    movie_ids: list[MovieDbID] = []
    for item in items:
        pubDate = pd.Timestamp(item.find("pubDate").text)
        if pubDate < cutoff:
            break
        movie_id = item.find("tmdb:movieId").text
        movie_ids.append(int(movie_id))
    return movie_ids
