import logging

from fastapi import APIRouter

import backend.data.mutations as mu
import backend.utils.stuff as stuff
from backend.routing_lib import request_parser as parser
from backend.scheduled_tasks.check_rss import get_movie_list_from_rss
from backend.types.api_schemas import Primitive
from backend.types.my_types import *

router = APIRouter()


@router.get("/force-refresh")
async def force_refresh(user_id: parser.ActiveUserID) -> dict[str, Primitive]:
    logging.info("got a force refresh")
    year = stuff.current_year()
    movie_list = await get_movie_list_from_rss(user_id, year)
    for movie_id in movie_list:
        logging.debug(f"Got {movie_id} from {user_id}'s letterboxd.")
        mu.add_watchlist_entry(
            year=year,
            userId=user_id,
            movieId=movie_id,
            status=WatchStatus.SEEN,
        )
    total_new_entries = len(movie_list)
    return {"message": "Watchlist updated", "foundEntries": total_new_entries}
