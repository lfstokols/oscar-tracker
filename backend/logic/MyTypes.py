from typing import NewType, Literal, TypedDict, NotRequired
from enum import Enum


IDNum = NewType("IDNum", str)
MovID = NewType("MovID", IDNum)
UserID = NewType("UserID", IDNum)
CatID = NewType("CatID", IDNum)
DataFlavor = Literal["movies", "users", "nominations", "categories", "watchlist"]
WatchStatus = Literal["seen", "todo", "blank"]


# Nom = NewType('Nom', TypedDict['movie': MovID, 'category': CatID, 'note': str|None])
class Nom(TypedDict):
    movieId: MovID
    categoryId: CatID
    note: NotRequired[str | None]


class MovieColumns:
    ID = "id"
    TITLE = "title"
    IMDB_ID = "imdbId"
    RUNTIME = "runtime"  # This is removed before reaching frontend
    RUNTIME_HOURS = "runtime(hours)"
    RUNTIME_MINUTES = "runtime(minutes)"
    NUM_NOMS = "numNoms"

    @classmethod
    def values(cls):
        return [
            v for k, v in vars(cls).items() if not k.startswith("_") and not callable(v)
        ]


class NomColumns:
    MOVIE = "movieId"
    CATEGORY = "categoryId"
    NOTE = "note"

    @classmethod
    def values(cls):
        return [
            v for k, v in vars(cls).items() if not k.startswith("_") and not callable(v)
        ]


class CategoryColumns:
    ID = "id"
    SHORT_NAME = "shortName"
    FULL_NAME = "fullName"
    HAS_NOTE = "hasNote"
    IS_SHORT = "isShort"
    GROUPING = "grouping"
    MAX_NOMS = "maxNoms"

    @classmethod
    def values(cls):
        return [
            v for k, v in vars(cls).items() if not k.startswith("_") and not callable(v)
        ]


class WatchlistColumns:
    MOVIE = "movieId"
    USER = "userId"
    STATUS = "status"

    @classmethod
    def values(cls):
        return [
            v for k, v in vars(cls).items() if not k.startswith("_") and not callable(v)
        ]


class UserColumns:
    ID = "id"
    NAME = "username"
    LETTERBOXD = "letterboxd"
    EMAIL = "email"

    @classmethod
    def values(cls):
        return [
            v for k, v in vars(cls).items() if not k.startswith("_") and not callable(v)
        ]


__all__ = [
    "MovID",
    "UserID",
    "CatID",
    "Nom",
    "DataFlavor",
    "IDNum",
    "WatchStatus",
    "MovieColumns",
    "NomColumns",
    "CategoryColumns",
    "WatchlistColumns",
    "UserColumns",
]
