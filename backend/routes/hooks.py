from flask import jsonify, request, Blueprint
from backend.routing_lib import utils
from backend.routing_lib.utils import handle_errors
from backend.types.api_validators import AnnotatedValidator
from backend.scheduled_tasks.check_rss import get_movie_list_from_rss
import backend.data.mutations as mu
from backend.types.my_types import *
from backend.types.api_schemas import WatchStatus_pyd
from datetime import datetime
import logging


hooks = Blueprint(
    "hooks",
    __name__,
    static_url_path="/hooks/",
)


@hooks.route("/force-refresh", methods=["GET"])
@handle_errors
def force_refresh():
    print("got a force refresh")
    # try:
    user_id = AnnotatedValidator(user=utils.get_active_user_id(request)).user
    assert user_id is not None
    movie_list = get_movie_list_from_rss(user_id, year=datetime.now().year - 1)
    for movie_id in movie_list:
        logging.debug(f"Got {movie_id} from {user_id}'s letterboxd.")
        mu.add_watchlist_entry(
            year=datetime.now().year - 1,
            userId=user_id,
            movieId=movie_id,
            status=WatchStatus_pyd.SEEN,
        )
    return jsonify({"message": "Watchlist updated"}), 200
