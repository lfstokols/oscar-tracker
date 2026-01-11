import logging
from datetime import datetime

import httpx
import pandas as pd
from bs4 import BeautifulSoup

import backend.data.mutations as mu
import backend.data.queries as qu
from backend.types.api_schemas import MovieID, UserID
from backend.types.api_validators import MovieValidator
from backend.types.my_types import *


async def update_user_watchlist(user_id: UserID) -> bool:
    """
    For a given user, check their letterboxd rss for relevant movies
    and update their watchlist.
    Also updates the last_check timestamp to only check for new movies.

    Returns: True if new movies were found, False otherwise.
    """
    current_year = datetime.now().year - 1
    idlist = await get_movie_list_from_rss(user_id, current_year)
    # * add to watchlist
    for id in idlist:
        logging.debug(f"Adding {id} to watchlist for {user_id}")
        mu.add_watchlist_entry(current_year, user_id, id,
                               WatchStatus(WatchStatus.SEEN))
    if len(idlist) > 0:
        return True
    return False


async def fetch_rss(account: str) -> BeautifulSoup:
    async with httpx.AsyncClient() as client:
        response = await client.get(f"https://letterboxd.com/{account}/rss/")
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
    logging.debug(f"Found {len(items)} items in the RSS feed.")
    movie_ids: list[MovieDbID] = []
    for item in items:
        # pubDate = pd.Timestamp(item.find("pubDate").text).tz_convert("UTC")
        # if pubDate < pd.Timestamp(cutoff):
        #     break
        movie_id_block = item.find("tmdb:movieId")
        if movie_id_block is None:
            logging.warning(f"No movie ID found in item: {str(item)[:100]}")
            continue
        movie_id = movie_id_block.text
        movie_ids.append(int(movie_id))
    return movie_ids


async def get_movie_list_from_rss(user_id: UserID, year: int) -> list[MovieID]:
    """
    For a given user, check their letterboxd rss for relevant movies
    and return a list of movies.

    Returns: A list of movies ids (e.g. mov_123aef).
    """
    # * compute parameters
    account = (await qu.get_my_user_data(user_id)).get("letterboxd")
    if account is None:
        return []
    # * fetch the data
    soup = await fetch_rss(account)
    mdb_id_list = parse_rss(soup)
    logging.debug(
        f"While checking RSS for {user_id}, found {len(mdb_id_list)} movie IDs listed on the page."
        f"For example: {mdb_id_list[:3]}"
    )
    # * identify the movies
    movies = qu.get_movies(year)
    sample_data = [
        [x[MovieColumns.ID.value], x[MovieColumns.MovieDB_ID.value]] for x in movies[:3]
    ]
    sample_strings = [f"{x[0]}: {type(x[1])} {x[1]}" for x in sample_data]
    logging.debug(
        f"The movie data has tmdb ids like {', '.join(sample_strings)}")
    my_id_list = [
        row[MovieColumns.ID.value]
        for row in movies
        if int(row[MovieColumns.MovieDB_ID.value]) in mdb_id_list
    ]
    logging.debug(
        f"Of those {len(mdb_id_list)} movie IDs listed on the page, {len(my_id_list)} matched movies in my database."
    )
    validated_idlist: list[MovieID] = []
    for id in my_id_list:
        try:
            validated_idlist.append(MovieValidator(movie=id).movie)
        except:
            logging.warning(f"Invalid movie id: {id}")

    return validated_idlist
