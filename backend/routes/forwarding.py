import re

import requests
from fastapi import APIRouter, HTTPException, Request

import backend.routing_lib.request_parser as parser
from backend.access_external.get_links import get_Imdb, get_justwatch
from backend.data.db_connections import Session
from backend.data.db_schema import Movie
from backend.routing_lib.error_handling import APIArgumentError
from backend.types.api_schemas import MovieID
from backend.types.api_validators import validate_movie_id

router = APIRouter()


@router.get("/letterboxd/search")
async def serve_letterboxd_search(request: Request):
    """
    Just a proxy for letterboxd.com search
    The search term is passed as a query parameter,
    and the results from letterboxd.com/s/search/members/<search_term>
    are returned.
    The results come in as html and are returned as html.
    """
    search_term = request.query_params.get("searchTerm")
    url = f"https://letterboxd.com/s/search/members/{search_term}"
    response = requests.get(url)
    return response.text


@router.get("/get_link")
async def serve_get_link(request: Request):
    """
    Returns a link to the service for the given movie_id and service.
    """
    movie_id = parser.get_param(request, "id")
    valid_movie_id, code = validate_movie_id(movie_id)
    if code != 0:
        raise APIArgumentError(
            f"Invalid movie id: {movie_id}", [("movie_id", "query params")]
        )
    service = parser.get_param(request, "service")
    if service not in ["justwatch", "imdb"]:
        raise APIArgumentError(
            f"Invalid service: {service}", [("service", "query params")]
        )
    with Session() as session:
        movie = (
            session.query(Movie.movie_db_id, Movie.movie_id)
            .filter(Movie.movie_id == valid_movie_id)
            .first()
        )
        if movie is None:
            raise APIArgumentError(
                f"Movie not found: {movie_id}", [("movie_id", "query params")]
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
async def serve_moviedb(request: Request):
    """
    Just a proxy for moviedb.org
    """
    url = "https://www.moviedb.org/"
    response = requests.get(url)
    return response.text
