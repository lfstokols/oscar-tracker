import logging
from typing import Any

import httpx
from rapidfuzz import fuzz

import backend.utils.env_reader as env
from backend.intake.schemas import SearchResult
from backend.types.api_schemas import MovieID

TMDB_API_BASE = "https://api.themoviedb.org/3"
TMDB_HEADERS = {
    "Authorization": f"Bearer {env.TMDB_API_KEY}",
    "accept": "application/json",
}


async def search_tmdb_movie(title: str, year: int) -> list[dict[str, Any]]:
    """
    Search TMDB for a movie by title and year.

    Returns list of search results.
    """
    endpoint = f"{TMDB_API_BASE}/search/movie"
    params: dict[str, str | int | bool] = {
        "query": title,
        "year": year,
        "include_adult": False,
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(endpoint, headers=TMDB_HEADERS, params=params)

    if response.status_code != 200:
        logging.error(f"TMDB search failed: {response.status_code} - {response.text}")
        return []

    data = response.json()
    return data.get("results", [])


async def get_tmdb_movie_details(tmdb_id: int) -> dict[str, Any] | None:
    """
    Get detailed movie info from TMDB including imdb_id, runtime, poster_path.
    """
    endpoint = f"{TMDB_API_BASE}/movie/{tmdb_id}"

    async with httpx.AsyncClient() as client:
        response = await client.get(endpoint, headers=TMDB_HEADERS)

    if response.status_code != 200:
        logging.error(f"TMDB details failed: {response.status_code} - {response.text}")
        return None

    return response.json()


def calculate_confidence(
    local_title: str,
    local_year: int,
    tmdb_title: str,
    tmdb_year: int | None,
    tmdb_runtime: int | None,
) -> float:
    """
    Calculate confidence score for a TMDB match.

    Returns a score from 0.0 to 1.0.
    """
    # Title similarity (weight: 60%)
    title_score = fuzz.token_sort_ratio(local_title.lower(), tmdb_title.lower()) / 100.0

    # Year match (weight: 30%)
    # Allow 1 year off for release date discrepancies
    if tmdb_year is None:
        year_score = 0.5
    elif local_year == tmdb_year:
        year_score = 1.0
    elif abs(local_year - tmdb_year) == 1:
        year_score = 0.7
    else:
        year_score = 0.0

    # Runtime sanity check (weight: 10%)
    # Just check that it's a reasonable runtime
    if tmdb_runtime is None:
        runtime_score = 0.5
    elif 5 <= tmdb_runtime <= 300:  # Between 5 minutes and 5 hours
        runtime_score = 1.0
    else:
        runtime_score = 0.0

    return 0.6 * title_score + 0.3 * year_score + 0.1 * runtime_score


async def search_movie_tmdb_id(
    movie_id: MovieID,
    title: str,
    year: int,
) -> SearchResult:
    """
    Search TMDB for a movie and return the best matching TMDB ID.

    Returns a SearchResult with the TMDB ID and confidence score.
    """
    try:
        results = await search_tmdb_movie(title, year)

        if not results:
            return SearchResult(
                movie_id=movie_id,
                title=title,
                status="not_found",
            )

        # Find best match
        best_match = None
        best_confidence = 0.0

        for result in results[:5]:  # Check top 5 results
            tmdb_title = result.get("title", "")
            release_date = result.get("release_date", "")
            tmdb_year = int(release_date[:4]) if release_date else None

            confidence = calculate_confidence(
                local_title=title,
                local_year=year,
                tmdb_title=tmdb_title,
                tmdb_year=tmdb_year,
                tmdb_runtime=None,
            )

            if confidence > best_confidence:
                best_confidence = confidence
                best_match = result

        if best_match is None or best_confidence < 0.5:
            return SearchResult(
                movie_id=movie_id,
                title=title,
                status="not_found",
            )

        return SearchResult(
            movie_id=movie_id,
            title=title,
            tmdb_id=best_match["id"],
            confidence=best_confidence,
            status="found",
        )

    except Exception as e:
        logging.exception(f"Error searching TMDB for movie {movie_id}: {e}")
        return SearchResult(
            movie_id=movie_id,
            title=title,
            status="error",
            error=str(e),
        )


def extract_enrichment_data(details: dict[str, Any]) -> dict[str, Any]:
    """
    Extract the fields we want to save to the database from TMDB details.
    """
    return {
        "movie_db_id": str(details.get("id")),
        "imdb_id": details.get("imdb_id"),
        "runtime": details.get("runtime"),
        "poster_path": details.get("poster_path"),
    }
