import pandera as pa
from pandera.typing import DataFrame, Series
from typing import Optional
from enum import Enum


# * Enums
class WatchStatus(str, Enum):
    SEEN = "seen"
    TODO = "todo"
    BLANK = "blank"


class Grouping(str, Enum):
    BIG_THREE = "Big Three"
    ACTING = "Acting"
    FILMKRAFT = "Technical (Filmkraft)"
    ART = "Technical (Art)"
    AUDIO = "Technical (Audio)"
    BEST_IN_CLASS = "Best in Class"
    SHORT = "Short"


# * Database Schema Models
class db_User(pa.DataFrameModel):
    id: Series[str] = pa.Field(check_matches=r"^usr_[0-9a-f]{6}$")
    username: Series[str]
    letterboxd: Series[str]
    email: Series[str]

    class Config:
        coerce = True


class db_Movie(pa.DataFrameModel):
    id: Series[str] = pa.Field(check_matches=r"^mov_[0-9a-f]{6}$")
    title: Series[str]
    ImdbId: Series[str] = pa.Field(nullable=True)
    movieDbId: Series[int] = pa.Field(nullable=True)
    runtime: Series[int] = pa.Field(nullable=True)  # Stored in minutes
    posterPath: Series[str] = pa.Field(nullable=True)

    class Config:
        coerce = True


class db_Category(pa.DataFrameModel):
    id: Series[str] = pa.Field(check_matches=r"^cat_[a-z]{4}$")
    shortName: Series[str]
    fullName: Series[str]
    hasNote: Series[bool]
    isShort: Series[bool]
    grouping: Series[str] = pa.Field(isin=[g.value for g in Grouping])
    maxNoms: Series[int] = pa.Field(isin=[5, 10])

    class Config:
        coerce = True


class db_Nom(pa.DataFrameModel):
    movieId: Series[str] = pa.Field(check_matches=r"^mov_[0-9a-f]{6}$")
    categoryId: Series[str] = pa.Field(check_matches=r"^cat_[a-z]{4}$")
    note: Series[str] = pa.Field(nullable=True)

    class Config:
        coerce = True


class db_Watchlist(pa.DataFrameModel):
    userId: Series[str] = pa.Field(check_matches=r"^usr_[0-9a-f]{6}$")
    movieId: Series[str] = pa.Field(check_matches=r"^mov_[0-9a-f]{6}$")
    status: Series[str] = pa.Field(isin=[s.value for s in WatchStatus])

    class Config:
        coerce = True
