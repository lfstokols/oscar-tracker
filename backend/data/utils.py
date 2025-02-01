import logging
import random

import pandas as pd
from backend.data.db_connections import Session
from backend.data.db_schema import Movie, User, Nomination, Category
from backend.types.api_schemas import MovieID, UserID
from backend.types.api_validators import MovieValidator, UserValidator
import sqlalchemy as sa


def create_unique_movie_id(year: int | str) -> MovieID:
    with Session() as session:
        existing_ids = session.execute(sa.select(Movie.id)).scalars().all()
    tries = 0
    while tries < 100:
        id = (
            "mov_"
            + (f"{(int(year)-1927)%256:02x}" if str(year).isdigit() else "00")
            + f"{random.randint(0, 0xFF_FF):04x}"
        )
        if id not in existing_ids:

            validated_id = MovieValidator(movie=id).movie
            return validated_id
        tries += 1
    raise Exception("Unable to create unique ID. Erroring out to avoid infinite loop.")


def create_unique_user_id() -> UserID:
    with Session() as session:
        existing_ids = session.execute(sa.select(User.user_id)).scalars().all()
    tries = 0
    while tries < 100:
        id = "usr_" + f"{random.randint(0, 0xFFF_FFF):06x}"
        if id not in existing_ids:
            try:
                validated_id = UserValidator(user=id).user
            except Exception as e:
                logging.error(
                    f"I made a new user ID {id} and it failed validation somehow. Error: {e}"
                )
                raise
            return validated_id
        tries += 1
    raise Exception("Unable to create unique ID. Erroring out to avoid infinite loop.")


def result_to_dict(result: sa.Result) -> list[dict]:
    mappings = result.mappings().all()
    return [dict(row) for row in mappings]

def validate_nominations() -> Exception | None:
    nom_counts = (
            sa.select(
                Nomination.year,
                Nomination.category_id,
                sa.func.count().label("num_nominations"),
            )
            .select_from(Nomination)
            .group_by(Nomination.category_id, Nomination.year)
        ).subquery()
    with Session() as session:
        result = session.execute(
            sa.select(
                (nom_counts.c.num_nominations == Category.max_nominations).label("is_valid"),
                nom_counts.c.category_id,
                nom_counts.c.year,
            )
            .select_from(nom_counts)
            .join(Category, nom_counts.c.category_id == Category.category_id)
        )
        data = result_to_dict(result)
    bad_categories = [(row["category_id"], row["year"]) for row in data if not row["is_valid"]]
    if len(bad_categories) > 0:
        return Exception(f"Found {len(bad_categories)} invalid nominations: {bad_categories}")
    return None

def debug_print_query(query: sa.Subquery, name: str="query", limit: int=0) -> None:
    with Session() as session:
        result = session.execute(query.select())
        if limit != 0:
            result = result.fetchmany(limit)
        print(name, '\n', pd.DataFrame(result))