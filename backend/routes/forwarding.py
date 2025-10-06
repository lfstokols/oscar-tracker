import re
from typing import Literal

import requests
from fastapi import APIRouter

from backend.access_external.get_links import get_Imdb, get_justwatch
from backend.data.db_connections import Session
from backend.data.db_schema import Movie
from backend.routing_lib.error_handling import APIArgumentError
from backend.types.api_schemas import MovieID, Primitive

router = APIRouter()


@router.get("/letterboxd/search")
async def serve_letterboxd_search(searchTerm: str):
    """
    Just a proxy for letterboxd.com search
    The search term is passed as a query parameter,
    and the results from letterboxd.com/s/search/members/<search_term>
    are returned.
    The results come in as html and are returned as html.
    """
    url = f"https://letterboxd.com/s/search/members/{searchTerm}"
    response = requests.get(url)
    return response.text


@router.get("/get_link")
async def serve_get_link(id: MovieID, service: Literal["justwatch", "imdb"]) -> dict[str, Primitive]:
    """
    Returns a link to the service for the given movie_id and service.
    """
    if service not in ["justwatch", "imdb"]:
        raise APIArgumentError(
            f"Invalid service: {service}", [("service", "query params")]
        )
    with Session() as session:
        movie = (
            session.query(Movie.movie_db_id, Movie.movie_id)
            .filter(Movie.movie_id == id)
            .first()
        )
        if movie is None:
            raise APIArgumentError(
                f"Movie not found: {id}", [("movie_id", "query params")]
            )
        id_number = int(movie[0])
    if service == "justwatch":
        url, code = get_justwatch(id_number)
        if code == 1:
            return {"failed": True, "message": url}
    elif service == "imdb":
        url = get_Imdb(id_number)
    return {"failed": False, "url": url}


@router.get("/moviedb")
async def serve_moviedb() -> str:
    """
    Just a proxy for moviedb.org
    """
    url = "https://www.moviedb.org/"
    response = requests.get(url)
    return response.text
