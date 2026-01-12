import logging
from contextlib import contextmanager
from typing import Any

import pandas as pd
import sqlalchemy as sa

from backend.data.db_connections import Session
from backend.data.db_schema import Movie, Nomination, User, Watchnotice
from backend.data.utils import create_unique_movie_id, create_unique_user_id
from backend.types.api_schemas import MovieID, UserID
from backend.types.api_validators import MovieValidator
from backend.types.my_types import *


def add_user(username: str, **kwargs) -> UserID:
    user_id = create_unique_user_id()
    try:
        assert username is not None
        assert all(
            key in User.__table__.columns.keys() for key in kwargs
        ), f"Invalid user column(s): {[k for k in kwargs if k not in User.__table__.columns.keys()]}"
    except Exception as e:
        logging.error(f"Tried to add new user with invalid columns: {e}")
        raise e
    mutation = sa.insert(User).values(
        user_id=user_id,
        username=username,
        **kwargs,
    )
    with Session() as session:
        _ = session.execute(mutation)
        session.commit()
    return user_id


def update_user(userId: UserID, new_data: dict[str, str]):

    assert all(
        key in User.__table__.columns.keys() for key in new_data
    ), f"Invalid user column(s): {[k for k in new_data if k not in User.__table__.columns.keys()]}"
    with Session() as session:
        _ = session.execute(
            sa.update(User).where(User.user_id == userId).values(**new_data)
        )
        session.commit()


def delete_user(userId: UserID):
    with Session() as session:
        _ = session.execute(sa.delete(User).where(User.user_id == userId))
        session.commit()


@contextmanager
def get_and_set_rss_timestamp(userId: UserID):
    with Session() as session:
        last_checked = session.execute(
            sa.select(User.last_letterboxd_check).where(User.user_id == userId)
        ).scalar()
        last_checked = (
            pd.Timestamp(
                last_checked, tz="UTC") if last_checked else pd.Timestamp.min
        )
        new_time = pd.Timestamp.now(tz="UTC")
        try:
            yield last_checked
        except Exception as e:
            logging.error(
                f"Error while checking rss, last_checked_time not updated: {e}"
            )
            raise e
        else:
            _ = session.execute(
                sa.update(User)
                .where(User.user_id == userId)
                  .values(last_letterboxd_check=new_time)
            )
            session.commit()


# Deletes existing entry if it exists
# returns True if the entry already existed, False if it didn't
def add_watchlist_entry(
    year: int, userId: UserID, movieId: MovieID, status: WatchStatus
):
    with Session() as session:
        if status == WatchStatus.BLANK:
            _ = session.execute(
                sa.delete(Watchnotice)
                .where(Watchnotice.year == year)
                  .where(Watchnotice.user_id == userId)
                  .where(Watchnotice.movie_id == movieId)
            )
            session.commit()
        else:
            # # * Delete any existing entry
            # session.execute(
            #     sa.delete(Watchnotice)
            #     .where(Watchnotice.year == year)
            #     .where(Watchnotice.user_id == userId)
            #     .where(Watchnotice.movie_id == movieId)
            # )
            # * Add new entry
            logging.debug(
                f"Adding watchlist entry for {userId} in {year} for {movieId} with status {status}"
            )
            mutation = (
                sa.insert(Watchnotice)
                .prefix_with("OR REPLACE")
                .values(
                    year=year,
                    user_id=userId,
                    movie_id=movieId,
                    status=status,
                )
            )
            logging.debug(f"Mutation: {mutation}")
            _ = session.execute(mutation)
            session.commit()


def add_nomination(year, nomination: Nom):
    movie = nomination[NomColumns.MOVIE.value]
    category = nomination[NomColumns.CATEGORY.value]
    note = (
        nomination[NomColumns.NOTE.value]
        if NomColumns.NOTE.value in nomination
        else None
    )
    with Session() as session:
        _ = session.execute(
            sa.insert(Nomination)
            .prefix_with("OR REPLACE")
            .values(year=year, movie_id=movie, category_id=category, note=note)
        )
        session.commit()


# `movie` is usually the id of the movie to update
# If try_title_lookup, then `movie` is interpreted as the title of the movie
# 		In that case, the id of the movie is returned (whether it was found or created)
# `new_data` is a dictionary of new data to add or update
def update_movie(
    movie: MovieID,
    year: int,
    new_data: dict[str, Any] = {},
):
    movieId = movie
    try:
        _ = MovieValidator(movie=movieId)
    except Exception as e:
        logging.error(f"update_movie() got invalid movie id '{movieId}'. {e}")
        raise Exception(
            f"Invalid movie id '{movieId}'.\n" "Did you send a title?") from e
    assert all(
        key in Movie.__table__.columns.keys() for key in new_data
    ), f"Invalid movie column(s): {[k for k in new_data if k not in Movie.__table__.columns.keys()]}"
    with Session() as session:
        _ = session.execute(
            sa.update(Movie).where(Movie.movie_id ==
                                   movieId).values(**new_data)
        )
        session.commit()


def add_movie(year: int, title: str) -> MovieID:
    id = create_unique_movie_id(year=year)
    with Session() as session:
        _ = session.execute(sa.insert(Movie).values(
            year=year, movie_id=id, title=title))
        session.commit()
    return id
