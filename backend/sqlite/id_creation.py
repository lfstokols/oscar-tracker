import random
from backend.types.api_schemas import MovieID, UserID
from backend.types.api_validators import AnnotatedValidator
from backend.sqlite.make_db import get_connection


def create_unique_movie_id(year: int | str) -> MovieID:
    with get_connection() as (conn, cursor):
        existing_ids = cursor.execute(
            "SELECT movie_id FROM movies WHERE year = ?", (year,)
        ).fetchall()
        existing_ids = [row[0] for row in existing_ids]
    tries = 0
    while tries < 100:
        id = (
            "mov_"
            + (f"{(int(year)-1927)%256:02x}" if str(year).isdigit() else "00")
            + f"{random.randint(0, 0xFF_FF):04x}"
        )
        if id not in existing_ids:
            AnnotatedValidator(movie=id)
            validated_id: MovieID = id
            return validated_id
        tries += 1
    raise Exception("Unable to create unique ID. Erroring out to avoid infinite loop.")


def create_unique_user_id() -> UserID:
    with get_connection() as (conn, cursor):
        existing_ids = cursor.execute("SELECT user_id FROM users").fetchall()
        existing_ids = [row[0] for row in existing_ids]
    tries = 0
    while tries < 100:
        id = "usr_" + f"{random.randint(0, 0xFFF_FFF):06x}"
        if id not in existing_ids:
            AnnotatedValidator(user=id)
            validated_id: UserID = id
            return validated_id
        tries += 1
    raise Exception("Unable to create unique ID. Erroring out to avoid infinite loop.")
