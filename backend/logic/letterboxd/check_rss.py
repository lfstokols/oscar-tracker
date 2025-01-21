from datetime import datetime
import pandas as pd
from backend.logic.storage_manager import StorageManager
from backend.types.my_types import *
from backend.types.api_schemas import UserID
import requests
from bs4 import BeautifulSoup

import backend.logic.Mutations as mu


def update_user_watchlist(user_id: UserID) -> bool:
    """
    For a given user, check their letterboxd rss for relevant movies
    and update their watchlist.
    Also updates the last_check timestamp to only check for new movies.

    Returns: True if new movies were found, False otherwise.
    """
    storage = StorageManager.get_storage()
    # * compute parameters
    account = storage.read("users").at[user_id, UserColumns.LETTERBOXD]
    cutoff = mu.get_and_set_rss_timestamp(user_id)
    if cutoff is None:
        print("cutoff was None in check_rss.update_user_watchlist")
        cutoff = pd.Timestamp.now(tz="UTC") - pd.Timedelta(weeks=52)
    # * fetch the data
    soup = fetch_rss(account)
    idlist = parse_rss(soup, cutoff)
    # * identify the movies
    movies = storage.read("movies")
    t_to_me = pd.Series(movies.index, index=movies["alternate_id_column"])
    idlist = t_to_me[t_to_me.index.isin(idlist)]
    # * add to watchlist
    current_year = (
        datetime.now().year - 1
    )  # * while the system is live, the movies are from last year
    for id in idlist:
        mu.add_watchlist_entry(
            storage, current_year, user_id, id, WatchStatus(WatchStatus.SEEN)
        )
    if len(idlist) > 0:
        return True
    return False


def fetch_rss(account: str) -> BeautifulSoup:
    response = requests.get(f"https://letterboxd.com/{account}/rss")
    soup = BeautifulSoup(response.text, "html.parser")
    return soup


def parse_rss(soup: BeautifulSoup, cutoff: pd.Timestamp) -> list[MovieDbID]:
    items = soup.find_all("item")
    movie_ids = []
    for item in items:
        pubDate = pd.Timestamp(item.find("pubDate").text)
        if pubDate < cutoff:
            break
        movie_id = item.find("tmdb:movieId").text
        movie_ids.append(int(movie_id))
    return movie_ids
