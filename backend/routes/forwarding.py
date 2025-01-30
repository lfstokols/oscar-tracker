from flask import request, Blueprint
import requests
from backend.routing_lib.utils import handle_errors
import backend.utils.env_reader as env

forwarding = Blueprint("forwarding", __name__)


@forwarding.route("/letterboxd/search", methods=["GET"])
@handle_errors
def serve_letterboxd_search():
    """
    Just a proxy for letterboxd.com search
    The search term is passed as a query parameter,
    and the results from letterboxd.com/s/search/members/<search_term>
    are returned.
    The results come in as html and are returned as html.
    """
    search_term = request.args.get("searchTerm")
    url = f"https://letterboxd.com/s/search/members/{search_term}"
    response = requests.get(url)
    return response.text


@forwarding.route("/moviedb", methods=["GET"])
@handle_errors
def serve_moviedb():
    """
    Just a proxy for moviedb.org
    """
    url = "https://www.moviedb.org/"
    response = requests.get(url)
    return response.text
