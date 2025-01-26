import sqlite3
import sqlalchemy as sa
from sqlalchemy.orm import declarative_base, relationship
from contextlib import contextmanager

import backend.utils.env_reader as env

DB_PATH = env.DATABASE_PATH / "db.sqlite"


@contextmanager
def get_connection():
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        yield conn, cursor


def init_db():
    with get_connection() as (conn, cursor):
        # Create users table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                username TEXT,
                letterboxd TEXT,
                email TEXT,
                last_letterboxd_check TIMESTAMP
            )
        """
        )

        # Create movies table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS movies (
                movie_id TEXT PRIMARY KEY,
                year INTEGER NOT NULL,
                title TEXT NOT NULL,
                imdb_id TEXT,
                movie_db_id TEXT,
                runtime INTEGER,
                poster_path TEXT,
                subtitle_position INTEGER
            )
        """
        )

        # Create categories table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS categories (
                category_id TEXT PRIMARY KEY,
                short_name TEXT NOT NULL,
                full_name TEXT NOT NULL,
                max_nominations INTEGER,
                is_short BOOLEAN NOT NULL,
                has_note BOOLEAN NOT NULL,
                grouping TEXT
            )
        """
        )

        # Create nominations table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS nominations (
                nomination_id INTEGER PRIMARY KEY AUTOINCREMENT,
                year INTEGER NOT NULL,
                movie_id TEXT NOT NULL,
                category_id TEXT NOT NULL,
                note TEXT,
                FOREIGN KEY (movie_id) REFERENCES movies (movie_id),
                FOREIGN KEY (category_id) REFERENCES categories (category_id)
            )
        """
        )

        # Create watchlist table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS watchlist (
                year INTEGER NOT NULL,
                user_id TEXT NOT NULL,
                movie_id TEXT NOT NULL,
                status TEXT NOT NULL,
                PRIMARY KEY (user_id, movie_id),
                FOREIGN KEY (user_id) REFERENCES users (user_id),
                FOREIGN KEY (movie_id) REFERENCES movies (movie_id)
            )
        """
        )

        # Create indices for better query performance
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_nominations_year ON nominations(year)"
        )
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_movies_year ON movies(year)")
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id)"
        )


Base = sa.declarative_base()


class Users(Base):
    __tablename__ = "users"
    user_id = sa.Column(sa.String, primary_key=True)
    username = sa.Column(sa.String)
    letterboxd = sa.Column(sa.String)
    email = sa.Column(sa.String)
    last_letterboxd_check = sa.Column(sa.DateTime)


class Movies(Base):
    __tablename__ = "movies"
    movie_id = sa.Column(sa.String, primary_key=True)
    year = sa.Column(sa.Integer)
    title = sa.Column(sa.String)
    imdb_id = sa.Column(sa.String)
    movie_db_id = sa.Column(sa.String)
    runtime = sa.Column(sa.Integer)
    poster_path = sa.Column(sa.String)
    subtitle_position = sa.Column(sa.Integer)

    nominations = relationship("Nomination", back_populates="movie")


class Categories(Base):
    __tablename__ = "categories"
    category_id = sa.Column(sa.String, primary_key=True)
    short_name = sa.Column(sa.String)
    full_name = sa.Column(sa.String)
    max_nominations = sa.Column(sa.Integer)
    is_short = sa.Column(sa.Boolean)
    has_note = sa.Column(sa.Boolean)
    grouping = sa.Column(sa.String)

    nominations = relationship("Nominations", back_populates="category")


class Nominations(Base):
    __tablename__ = "nominations"
    nomination_id = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    year = sa.Column(sa.Integer)
    movie_id = sa.Column(sa.String, sa.ForeignKey("movies.movie_id"))
    category_id = sa.Column(sa.String, sa.ForeignKey("categories.category_id"))
    note = sa.Column(sa.String)

    movie = relationship("Movies", back_populates="nominations")
    category = relationship("Categories", back_populates="nominations")


class Watchlist(Base):
    __tablename__ = "watchlist"
    year = sa.Column(sa.Integer)
    user_id = sa.Column(sa.String, sa.ForeignKey("users.user_id"), primary_key=True)
    movie_id = sa.Column(sa.String, sa.ForeignKey("movies.movie_id"), primary_key=True)
    status = sa.Column(sa.String)
