from collections.abc import Callable
from typing import Any, Optional
from contextlib import contextmanager
import sqlite3
import pandas as pd
from backend.utils.env_reader import DATABASE_PATH
import backend.data_management.db_schemas as names
import backend.types.flavors as flv


class DatabaseManager:
    @contextmanager
    def get_connection(self):
        conn = sqlite3.connect(DATABASE_PATH)
        try:
            yield conn
        finally:
            conn.close()

    def read(
        self, flavor: flv.DataFlavor, year: int | str | None = None, **kwargs
    ) -> pd.DataFrame:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(f"SELECT * FROM {flavor}")
            result = cursor.fetchall()
            return pd.DataFrame(result)

    def edit(
        self,
        operation: Callable[[pd.DataFrame], tuple[pd.DataFrame, Any]],
        flavor: flv.DataFlavor,
        year: int | str | None = None,
        **kwargs,
    ) -> pd.DataFrame:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(f"SELECT * FROM {flavor}")
            result = pd.DataFrame(cursor.fetchall())
            new_data, feedback = operation(result)

            return feedback

    def get_movie(self, movie_id: str) -> Optional[dict]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM movies WHERE movie_id = ?", (movie_id,))
            result = cursor.fetchone()
            return (
                dict(zip([col[0] for col in cursor.description], result))
                if result
                else None
            )

    def add_movie(self, movie_data: dict) -> str:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO movies (movie_id, year, title, ImdbId, movieDbId, runtime, posterPath)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
                (
                    movie_data["movie_id"],
                    movie_data["year"],
                    movie_data["title"],
                    movie_data.get("ImdbId"),
                    movie_data.get("movieDbId"),
                    movie_data.get("runtime"),
                    movie_data.get("posterPath"),
                ),
            )
            conn.commit()
            return movie_data["movie_id"]
