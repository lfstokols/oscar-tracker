from pathlib import Path
from typing import Any

from fastapi import APIRouter
from fastapi.responses import HTMLResponse
import sqlalchemy as sa

from backend.data.db_connections import Session
from backend.data.db_schema import Category, Movie, Nomination
from backend.types.api_schemas import MovieID

router = APIRouter()
page_router = APIRouter()

STATIC_DIR = Path(__file__).parent.parent / "static"


@page_router.get("/", response_class=HTMLResponse)
async def admin_page():
    """Serve the admin HTML page."""
    return (STATIC_DIR / "admin.html").read_text()


@router.get("/movies")
async def get_admin_movies(year: int) -> list[dict[str, Any]]:
    """Get all movies for a year with all fields for admin editing."""
    with Session() as session:
        movies = session.execute(
            sa.select(Movie).where(Movie.year == year).order_by(Movie.title)
        ).scalars().all()
        return [
            {
                "movie_id": m.movie_id,
                "year": m.year,
                "title": m.title,
                "imdb_id": m.imdb_id,
                "movie_db_id": m.movie_db_id,
                "runtime": m.runtime,
                "poster_path": m.poster_path,
                "subtitle_position": m.subtitle_position,
            }
            for m in movies
        ]


@router.put("/movies/{movie_id}")
async def update_admin_movie(movie_id: MovieID, data: dict[str, Any]) -> dict[str, Any]:
    """Update a movie's fields."""
    allowed_fields = {
        "title", "imdb_id", "movie_db_id", "runtime", "poster_path", "subtitle_position"
    }
    update_data = {k: v for k, v in data.items() if k in allowed_fields}

    with Session() as session:
        _ = session.execute(
            sa.update(Movie).where(Movie.movie_id == movie_id).values(**update_data)
        )
        session.commit()

        movie = session.execute(
            sa.select(Movie).where(Movie.movie_id == movie_id)
        ).scalar_one()
        return {
            "movie_id": movie.movie_id,
            "year": movie.year,
            "title": movie.title,
            "imdb_id": movie.imdb_id,
            "movie_db_id": movie.movie_db_id,
            "runtime": movie.runtime,
            "poster_path": movie.poster_path,
            "subtitle_position": movie.subtitle_position,
        }


@router.get("/nominations")
async def get_admin_nominations(year: int) -> list[dict[str, Any]]:
    """Get all nominations for a year with all fields for admin editing."""
    with Session() as session:
        nominations = session.execute(
            sa.select(Nomination, Movie.title, Category.short_name)
            .join(Movie, Nomination.movie_id == Movie.movie_id)
            .join(Category, Nomination.category_id == Category.category_id)
            .where(Nomination.year == year)
            .order_by(Category.short_name, Movie.title)
        ).all()
        return [
            {
                "nomination_id": n.nomination_id,
                "year": n.year,
                "movie_id": n.movie_id,
                "movie_title": title,
                "category_id": n.category_id,
                "category_name": cat_name,
                "note": n.note,
            }
            for n, title, cat_name in nominations
        ]


@router.put("/nominations/{nomination_id}")
async def update_admin_nomination(
    nomination_id: int, data: dict[str, Any]
) -> dict[str, Any]:
    """Update a nomination's fields."""
    allowed_fields = {"movie_id", "category_id", "note"}
    update_data = {k: v for k, v in data.items() if k in allowed_fields}

    with Session() as session:
        _ = session.execute(
            sa.update(Nomination)
            .where(Nomination.nomination_id == nomination_id)
            .values(**update_data)
        )
        session.commit()

        result = session.execute(
            sa.select(Nomination, Movie.title, Category.short_name)
            .join(Movie, Nomination.movie_id == Movie.movie_id)
            .join(Category, Nomination.category_id == Category.category_id)
            .where(Nomination.nomination_id == nomination_id)
        ).one()
        n, title, cat_name = result
        return {
            "nomination_id": n.nomination_id,
            "year": n.year,
            "movie_id": n.movie_id,
            "movie_title": title,
            "category_id": n.category_id,
            "category_name": cat_name,
            "note": n.note,
        }


@router.get("/categories")
async def get_admin_categories() -> list[dict[str, Any]]:
    """Get all categories for dropdowns."""
    with Session() as session:
        categories = session.execute(
            sa.select(Category).order_by(Category.short_name)
        ).scalars().all()
        return [
            {"category_id": c.category_id, "short_name": c.short_name}
            for c in categories
        ]
