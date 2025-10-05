import logging
from datetime import datetime

from fastapi import APIRouter, Request

import backend.data.mutations as mu
from backend.routing_lib import request_parser as parser
from backend.routing_lib.error_handling import handle_errors
from backend.scheduled_tasks.check_rss import get_movie_list_from_rss
from backend.types.my_types import *

router = APIRouter()


@router.get("/force-refresh")
@handle_errors
async def force_refresh(request: Request):
    logging.info("got a force refresh")
    year = datetime.now().year - 1
    user_id = parser.get_active_user_id(request)
    movie_list = get_movie_list_from_rss(user_id, year)
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
