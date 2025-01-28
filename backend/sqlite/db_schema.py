import sqlite3
import sqlalchemy as sa
import sqlalchemy.orm as orm

# from sqlalchemy.orm import declarative_base, relationship
from contextlib import contextmanager
from backend.types.api_validators import AnnotatedValidator
import backend.utils.env_reader as env

DB_PATH = env.DATABASE_PATH / env.SQLITE_FILE_NAME


def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
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


Base = orm.declarative_base()

# * # * # * # * # * # *
# * Type Decorators # *
# * # * # * # * # * # *


class UserID_SQL(sa.TypeDecorator):
    impl = sa.String
    cache_ok = True

    def process_bind_param(self, value, dialect):
        return str(value) if value is not None else None

    def process_result_value(self, value, dialect):
        return AnnotatedValidator(user=value).user if value is not None else None


class MovieID_SQL(sa.TypeDecorator):
    impl = sa.String
    cache_ok = True

    def process_bind_param(self, value, dialect):
        return str(value) if value is not None else None

    def process_result_value(self, value, dialect):
        return AnnotatedValidator(movie=value).movie if value is not None else None


class CategoryID_SQL(sa.TypeDecorator):
    impl = sa.String
    cache_ok = True

    def process_bind_param(self, value, dialect):
        return str(value) if value is not None else None

    def process_result_value(self, value, dialect):
        return (
            AnnotatedValidator(category=value).category if value is not None else None
        )


# * # * # * # * # * #
# * Table Classes * #
# * # * # * # * # * #


class User(Base):
    __tablename__ = "users"
    user_id = sa.Column(UserID_SQL, primary_key=True)
    username = sa.Column(sa.String)
    letterboxd = sa.Column(sa.String)
    email = sa.Column(sa.String)
    # propic = sa.Column(sa.String)
    last_letterboxd_check = sa.Column(sa.DateTime)

    watchnotices = orm.relationship("Watchnotice", back_populates="user", viewonly=True)

    movies = orm.relationship("Movie", secondary="watchlist", viewonly=True)


class Movie(Base):
    __tablename__ = "movies"
    movie_id = sa.Column(MovieID_SQL, primary_key=True)
    year = sa.Column(sa.Integer)
    title = sa.Column(sa.String)
    imdb_id = sa.Column(sa.String)
    movie_db_id = sa.Column(sa.String)
    runtime = sa.Column(sa.Integer)
    poster_path = sa.Column(sa.String)
    subtitle_position = sa.Column(sa.Integer)

    nominations = orm.relationship("Nomination", back_populates="movie", viewonly=True)
    watchnotices = orm.relationship(
        "Watchnotice", back_populates="movie", viewonly=True
    )

    categories = orm.relationship(
        "Category", secondary="nominations", back_populates="nominees", viewonly=True
    )


class Category(Base):
    __tablename__ = "categories"
    category_id = sa.Column(CategoryID_SQL, primary_key=True)
    short_name = sa.Column(sa.String)
    full_name = sa.Column(sa.String)
    max_nominations = sa.Column(sa.Integer)
    is_short = sa.Column(sa.Boolean)
    has_note = sa.Column(sa.Boolean)
    grouping = sa.Column(sa.String)

    nominations = orm.relationship(
        "Nomination", back_populates="category", viewonly=True
    )

    nominees = orm.relationship(
        "Movie", secondary="nominations", back_populates="categories", viewonly=True
    )


class Nomination(Base):
    __tablename__ = "nominations"
    nomination_id = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    year = sa.Column(sa.Integer)
    movie_id = sa.Column(MovieID_SQL, sa.ForeignKey("movies.movie_id"))
    category_id = sa.Column(CategoryID_SQL, sa.ForeignKey("categories.category_id"))
    note = sa.Column(sa.String)

    movie = orm.relationship("Movie", back_populates="nominations", viewonly=True)
    category = orm.relationship("Category", back_populates="nominations", viewonly=True)


class Watchnotice(Base):
    __tablename__ = "watchlist"
    year = sa.Column(sa.Integer)
    user_id = sa.Column(UserID_SQL, sa.ForeignKey("users.user_id"), primary_key=True)
    movie_id = sa.Column(
        MovieID_SQL, sa.ForeignKey("movies.movie_id"), primary_key=True
    )
    status = sa.Column(sa.String)

    user = orm.relationship("User", back_populates="watchnotices", viewonly=True)
    movie = orm.relationship("Movie", back_populates="watchnotices", viewonly=True)
