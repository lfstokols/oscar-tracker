import logging
import random
from backend.data.db_schema import Movie, User
from backend.types.api_schemas import MovieID, UserID
from backend.types.api_validators import MovieValidator, UserValidator
from backend.data.db_connections import Session
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
            validated_id: UserID = id
            return validated_id
        tries += 1
    raise Exception("Unable to create unique ID. Erroring out to avoid infinite loop.")


def result_to_dict(result: sa.Result) -> list[dict]:
    mappings = result.mappings().all()
    return [dict(row) for row in mappings]
