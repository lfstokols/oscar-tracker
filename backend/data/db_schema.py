from __future__ import annotations

import sqlite3
from datetime import datetime
from typing import override

import sqlalchemy as sa
import sqlalchemy.orm as orm
from pydantic import EmailStr
from sqlalchemy import Index
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

import backend.utils.env_reader as env
from backend.types.api_schemas import CategoryID, MovieID, UserID
from backend.types.api_validators import AnnotatedValidator
from backend.types.my_types import WatchStatus

DB_PATH = env.DATABASE_PATH / env.SQLITE_FILE_NAME


class Base(DeclarativeBase):
    pass


def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        # Create users table
        _ = cursor.execute(
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
        _ = cursor.execute(
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
        _ = cursor.execute(
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
        _ = cursor.execute(
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
        _ = cursor.execute(
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
        _ = cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_nominations_year ON nominations(year)"
        )
        _ = cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_movies_year ON movies(year)")
        _ = cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id)"
        )


# * # * # * # * # * # *
# * Type Decorators # *
# * # * # * # * # * # *


class UserID_SQL(sa.TypeDecorator[UserID]):
    impl = sa.String
    cache_ok = True

    @override
    def process_bind_param(self, value, dialect):
        return str(value) if value is not None else None

    @override
    def process_result_value(self, value, dialect):
        return AnnotatedValidator(user=value).user


class MovieID_SQL(sa.TypeDecorator[MovieID]):
    impl = sa.String
    cache_ok = True

    @override
    def process_bind_param(self, value, dialect):
        return str(value) if value is not None else None

    @override
    def process_result_value(self, value, dialect):
        return AnnotatedValidator(movie=value).movie


class CategoryID_SQL(sa.TypeDecorator[CategoryID]):
    impl = sa.String
    cache_ok = True

    @override
    def process_bind_param(self, value, dialect):
        return str(value) if value is not None else None

    @override
    def process_result_value(self, value, dialect):
        return AnnotatedValidator(category=value).category


class Email_SQL(sa.TypeDecorator[EmailStr]):
    impl = sa.String
    cache_ok = True

    @override
    def process_bind_param(self, value, dialect):
        return str(value) if value else None

    @override
    def process_result_value(self, value, dialect):
        return value if value else None


class WatchStatus_SQL(sa.TypeDecorator[WatchStatus]):
    impl = sa.String
    cache_ok = True

    @override
    def process_bind_param(self, value, dialect):
        return value.value if value else None

    @override
    def process_result_value(self, value, dialect):
        return WatchStatus(value) if value else None


# * # * # * # * # * #
# * Table Classes * #
# * # * # * # * # * #


class User(Base):
    __tablename__ = "users"
    user_id: Mapped[UserID] = mapped_column(UserID_SQL, primary_key=True)
    username: Mapped[str] = mapped_column(sa.String)
    letterboxd: Mapped[str | None] = mapped_column(sa.String, nullable=True)
    email: Mapped[EmailStr | None] = mapped_column(Email_SQL, nullable=True)
    last_letterboxd_check: Mapped[datetime | None] = mapped_column(
        sa.DateTime, nullable=True)

    watchnotices = orm.relationship(
        "Watchnotice", back_populates="user", viewonly=True)

    movies = orm.relationship("Movie", secondary="watchlist", viewonly=True)


class Movie(Base):
    __tablename__ = "movies"
    movie_id: Mapped[MovieID] = mapped_column(MovieID_SQL, primary_key=True)
    year: Mapped[int] = mapped_column(sa.Integer, nullable=False)
    title: Mapped[str] = mapped_column(sa.String, nullable=False)
    imdb_id: Mapped[str | None] = mapped_column(sa.String, nullable=True)
    movie_db_id: Mapped[str | None] = mapped_column(sa.String, nullable=True)
    runtime: Mapped[int | None] = mapped_column(sa.Integer, nullable=True)
    poster_path: Mapped[str | None] = mapped_column(sa.String, nullable=True)
    subtitle_position: Mapped[int | None] = mapped_column(
        sa.Integer, nullable=True)

    nominations = orm.relationship(
        "Nomination", back_populates="movie", viewonly=True)
    watchnotices = orm.relationship(
        "Watchnotice", back_populates="movie", viewonly=True
    )

    categories = orm.relationship(
        "Category", secondary="nominations", back_populates="nominees", viewonly=True
    )

    @hybrid_property
    def is_short(self) -> bool:
        """True if any nomination is in a short film category."""
        return any(nom.category.is_short for nom in self.nominations)

    @is_short.inplace.expression
    @classmethod
    def _is_short_expr(cls) -> sa.ColumnElement[bool]:
        return (
            sa.select(sa.func.max(Category.is_short))
            .where(Nomination.movie_id == cls.movie_id)
            .where(Nomination.category_id == Category.category_id)
            .correlate(cls)
            .scalar_subquery()
        )

    @hybrid_property
    def is_multinom(self) -> bool:
        """True if the movie has more than one nomination."""
        return len(self.nominations) > 1

    @is_multinom.inplace.expression
    @classmethod
    def _is_multinom_expr(cls) -> sa.ColumnElement[bool]:
        return (
            sa.select(sa.func.count() > 1)
            .where(Nomination.movie_id == cls.movie_id)
            .correlate(cls)
            .scalar_subquery()
        )

    @hybrid_property
    def num_noms(self) -> int:
        """Number of nominations for this movie."""
        return len(self.nominations)

    @num_noms.inplace.expression
    @classmethod
    def _num_noms_expr(cls) -> sa.ColumnElement[int]:
        return (
            sa.select(sa.func.count())
            .where(Nomination.movie_id == cls.movie_id)
            .correlate(cls)
            .scalar_subquery()
        )

    @hybrid_property
    def runtime_hours(self) -> str | None:
        """Hour portion of the runtime in HH:MM format."""
        return f"{self.runtime // 60}" if self.runtime else None

    @runtime_hours.inplace.expression
    @classmethod
    def _runtime_hours_expr(cls) -> sa.ColumnElement[str | None]:
        return (
            sa.func.printf("%d", cls.runtime // 60)
            .where(cls.runtime.isnot(None))
            .correlate(cls)
            .scalar_subquery()
        )

    @hybrid_property
    def runtime_minutes(self) -> int | None:
        """Minute portion of the runtime in HH:MM format."""
        return self.runtime % 60 if self.runtime else None

    @runtime_minutes.inplace.expression
    @classmethod
    def _runtime_minutes_expr(cls) -> sa.ColumnElement[int | None]:
        return (cls.runtime % 60).where(cls.runtime.isnot(None)).correlate(cls).scalar_subquery()

    @hybrid_property
    def main_title(self) -> str:
        """Main title of the movie."""
        return self.title if self.subtitle_position is None else self.title[:self.subtitle_position]

    @main_title.inplace.expression
    @classmethod
    def _main_title_expr(cls) -> sa.ColumnElement[str]:
        return sa.case(
            (cls.subtitle_position.is_(None), cls.title),
            else_=sa.func.substr(cls.title, 1, cls.subtitle_position),
        ).correlate(cls).scalar_subquery()

    @hybrid_property
    def subtitle(self) -> str:
        """Subtitle of the movie."""
        return "" if self.subtitle_position is None else self.title[self.subtitle_position + 1:]

    @subtitle.inplace.expression
    @classmethod
    def _subtitle_expr(cls) -> sa.ColumnElement[str]:
        return sa.case(
            (cls.subtitle_position.is_(None), ""),
            else_=sa.func.substr(
                cls.title, cls.subtitle_position + 1, sa.func.length(cls.title)),
        ).correlate(cls).scalar_subquery()

    # Add index on year column
    __table_args__ = (Index("idx_movies_year", "year"),)


class Category(Base):
    __tablename__ = "categories"
    category_id: Mapped[CategoryID] = mapped_column(
        CategoryID_SQL, primary_key=True)
    short_name: Mapped[str] = mapped_column(sa.String, nullable=False)
    full_name: Mapped[str] = mapped_column(sa.String, nullable=False)
    max_nominations: Mapped[int] = mapped_column(sa.Integer)
    is_short: Mapped[bool] = mapped_column(sa.Boolean, nullable=False)
    has_note: Mapped[bool] = mapped_column(sa.Boolean, nullable=False)
    grouping: Mapped[str] = mapped_column(sa.String)

    nominations = orm.relationship(
        "Nomination", back_populates="category", viewonly=True
    )

    nominees = orm.relationship(
        "Movie", secondary="nominations", back_populates="categories", viewonly=True
    )


class Nomination(Base):
    __tablename__ = "nominations"
    nomination_id: Mapped[int] = mapped_column(
        sa.Integer, primary_key=True, autoincrement=True
    )
    year: Mapped[int] = mapped_column(sa.Integer)
    movie_id: Mapped[MovieID] = mapped_column(
        MovieID_SQL, sa.ForeignKey("movies.movie_id"))
    category_id: Mapped[CategoryID] = mapped_column(
        CategoryID_SQL, sa.ForeignKey("categories.category_id"))
    note: Mapped[str | None] = mapped_column(sa.String, nullable=True)

    movie = orm.relationship(
        "Movie", back_populates="nominations", viewonly=True)
    category = orm.relationship(
        "Category", back_populates="nominations", viewonly=True)

    # Add index on year column
    __table_args__ = (Index("idx_nominations_year", "year"),)


class Watchnotice(Base):
    __tablename__ = "watchlist"
    year: Mapped[int] = mapped_column(sa.Integer, nullable=False)
    user_id: Mapped[UserID] = mapped_column(
        UserID_SQL, sa.ForeignKey("users.user_id"), primary_key=True)
    movie_id: Mapped[MovieID] = mapped_column(
        MovieID_SQL, sa.ForeignKey("movies.movie_id"), primary_key=True)
    status: Mapped[WatchStatus] = mapped_column(
        WatchStatus_SQL, nullable=False)

    user = orm.relationship(
        "User", back_populates="watchnotices", viewonly=True)
    movie = orm.relationship(
        "Movie", back_populates="watchnotices", viewonly=True)

    # Add index on user_id column
    __table_args__ = (Index("idx_watchlist_user", "user_id"),)
