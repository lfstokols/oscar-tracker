import asyncio
from typing import Any, Literal

import cloudscraper
import httpx
from fastapi import APIRouter
from fastapi.responses import HTMLResponse

import backend.utils.env_reader as env
from backend.access_external.get_links import get_Imdb, get_justwatch
from backend.data.db_connections import Session
from backend.data.db_schema import Movie
from backend.routing_lib.error_handling import APIArgumentError
from backend.types.api_schemas import MovieID, Primitive

TMDB_API_BASE = "https://api.themoviedb.org/3"
TMDB_HEADERS = {
    "Authorization": f"Bearer {env.TMDB_API_KEY}",
    "accept": "application/json",
}

router = APIRouter()

# Reusable cloudscraper instance for Cloudflare-protected sites
_letterboxd_scraper = cloudscraper.create_scraper()


def _fetch_letterboxd(url: str) -> str:
    """Synchronous fetch using cloudscraper to bypass Cloudflare."""
    response = _letterboxd_scraper.get(url)
    response.raise_for_status()
    return response.text


@router.get("/letterboxd/search")
async def serve_letterboxd_search(searchTerm: str) -> HTMLResponse:
    """
    Just a proxy for letterboxd.com search
    The search term is passed as a query parameter,
    and the results from letterboxd.com/s/search/members/<search_term>
    are returned.
    The results come in as html and are returned as html.
    """
    url = f"https://letterboxd.com/s/search/members/{searchTerm}"
    html = await asyncio.to_thread(_fetch_letterboxd, url)
    return HTMLResponse(content=html)


@router.get("/get_link")
async def serve_get_link(id: MovieID, service: Literal["justwatch", "imdb"]) -> dict[str, Primitive]:
    """
    Returns a link to the service for the given movie_id and service.
    """
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
        url, code = await get_justwatch(id_number)
        if code == 1:
            return {"failed": True, "message": url}
    elif service == "imdb":
        url = await get_Imdb(id_number)
    return {"failed": False, "url": url}


@router.get("/moviedb")
async def serve_moviedb() -> HTMLResponse:
    """
    Just a proxy for moviedb.org
    """
    url = "https://www.moviedb.org/"
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
    return HTMLResponse(content=response.text)


@router.get("/tmdb/movie/{tmdb_id}")
async def get_tmdb_movie(tmdb_id: int) -> dict[str, Any]:
    """
    Proxy for TMDB movie details API.
    Returns movie details including overview, genres, cast, crew, etc.
    """
    endpoint = f"{TMDB_API_BASE}/movie/{tmdb_id}"
    params = {"append_to_response": "credits,watch/providers"}
    async with httpx.AsyncClient() as client:
        response = (await client.get(endpoint, headers=TMDB_HEADERS, params=params)).\
            raise_for_status()
    return response.json()


@router.get("/tmdb/movie/by_movie_id/{movie_id}")
async def get_tmdb_movie_by_movie_id(movie_id: MovieID) -> dict[str, Any]:
    """
    Proxy for TMDB movie details API, accepting our internal movie_id.
    Looks up the TMDB ID from the database, then fetches from TMDB.
    """
    with Session() as session:
        movie = (
            session.query(Movie.movie_db_id)
            .filter(Movie.movie_id == movie_id)
            .first()
        )
        if movie is None:
            raise APIArgumentError(f"Movie not found: {movie_id}", [
                                   ("movie_id", "path")])
        if movie[0] is None:
            raise APIArgumentError(
                f"Movie {movie_id} has no TMDB ID", [("movie_id", "path")]
            )
        tmdb_id = int(movie[0])
    return await get_tmdb_movie(tmdb_id)
