from typing import NewType, Literal, TypedDict, NotRequired
from enum import Enum


IDNum = NewType("IDNum", str)
MovID = NewType("MovID", IDNum)
UserID = NewType("UserID", IDNum)
CatID = NewType("CatID", IDNum)
DataFlavor = Literal["movies", "users", "nominations", "categories", "watchlist"]
# WatchStatus = Literal["seen", "todo", "blank"]


class myEnum:
    @classmethod
    def values(cls):
        return [
            v for k, v in vars(cls).items() if not k.startswith("_") and not callable(v)
        ]


# Nom = NewType('Nom', TypedDict['movie': MovID, 'category': CatID, 'note': str|None])
class Nom(TypedDict):
    movieId: MovID
    categoryId: CatID
    note: NotRequired[str | None]


class MovieColumns(myEnum):
    ID = "id"
    TITLE = "title"
    Imdb_ID = "ImdbId"
    MovieDB_ID = "movieDbId"
    RUNTIME = "runtime"  # This is removed before reaching frontend
    POSTER_PATH = "posterPath"

    # @classmethod
    # def values(cls):
    #     return [
    #         v for k, v in vars(cls).items() if not k.startswith("_") and not callable(v)
    #     ]


class DerivedMovieColumns(MovieColumns):
    RUNTIME_HOURS = "runtime_hours"
    RUNTIME_MINUTES = "runtime_minutes"
    NUM_NOMS = "numNoms"


class NomColumns(myEnum):
    MOVIE = "movieId"
    CATEGORY = "categoryId"
    NOTE = "note"

    # @classmethod
    # def values(cls):
    #     return [
    #         v for k, v in vars(cls).items() if not k.startswith("_") and not callable(v)
    #     ]


class CategoryColumns(myEnum):
    ID = "id"
    SHORT_NAME = "shortName"
    FULL_NAME = "fullName"
    HAS_NOTE = "hasNote"
    IS_SHORT = "isShort"
    GROUPING = "grouping"
    MAX_NOMS = "maxNoms"

    # @classmethod
    # def values(cls):
    #     return [
    #         v for k, v in vars(cls).items() if not k.startswith("_") and not callable(v)
    #     ]


class WatchlistColumns(myEnum):
    MOVIE = "movieId"
    USER = "userId"
    STATUS = "status"

    # @classmethod
    # def values(cls):
    #     return [
    #         v for k, v in vars(cls).items() if not k.startswith("_") and not callable(v)
    #     ]


class UserColumns(myEnum):
    ID = "id"
    NAME = "username"
    LETTERBOXD = "letterboxd"
    EMAIL = "email"

    # @classmethod
    # def values(cls):
    #     return [
    #         v for k, v in vars(cls).items() if not k.startswith("_") and not callable(v)
    #     ]


class DerivedUserColumns(UserColumns):
    PROFILE_PIC = "propic"
    NUM_SEEN_SHORT = "numSeenShort"
    NUM_SEEN_FEATURE = "numSeenFeature"
    NUM_TODO_SHORT = "numTodoShort"
    NUM_TODO_FEATURE = "numTodoFeature"
    SEEN_WATCHTIME = "seenWatchtime"
    TODO_WATCHTIME = "todoWatchtime"


class WatchStatus(myEnum):
    SEEN = "seen"
    TODO = "todo"
    BLANK = "blank"

    # @classmethod
    # def values(cls):
    #     return [
    #         v for k, v in vars(cls).items() if not k.startswith("_") and not callable(v)
    #     ]


class Grouping(myEnum):
    BigThree = "Big Three"
    Acting = "Acting"
    Filmkraft = "Technical (Filmkraft)"
    Art = "Technical (Art)"
    Audio = "Technical (Audio)"
    BestInClass = "Best in Class"
    Short = "Short"


__all__ = [
    "MovID",
    "UserID",
    "CatID",
    "Nom",
    "DataFlavor",
    "IDNum",
    "WatchStatus",
    "MovieColumns",
    "DerivedMovieColumns",
    "NomColumns",
    "CategoryColumns",
    "WatchlistColumns",
    "UserColumns",
    "DerivedUserColumns",
    "Grouping",
]
