from typing import NewType, Literal, TypedDict, NotRequired, Annotated, TypeVar
from enum import Enum


IDNum = NewType("IDNum", str)
MovID = NewType("MovID", IDNum)
UseID = NewType("UseID", IDNum)
CatID = NewType("CatID", IDNum)
DataFlavor = Literal["movies", "users", "nominations", "categories", "watchlist"]
GeneralDataFlavor = Literal[
    "movies",
    "users",
    "categories",
    "watchlist",
    "nominations",
    "c",
    "u",
    "n",
    "w",
    "m",
    "mov",
    "usr",
    "cat",
]
MovieDbID = Annotated[int, lambda x: x >= 0]
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


class MovieColumns(str, Enum):
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


# This creates a Literal that can only be the literal values of MovieColumns class attributes
# _movie_column_values = tuple(
#     val for (key, val) in MovieColumns.__dict__.items() if not key.startswith("_")
# )
# MovieColumnKey = Literal[_movie_column_values]


class DerivedMovieColumns(str, Enum):
    RUNTIME_HOURS = "runtime_hours"
    RUNTIME_MINUTES = "runtime_minutes"
    NUM_NOMS = "numNoms"
    IS_MULTI_NOM = "isMultiNom"
    IS_SHORT = "isShort"


class NomColumns(str, Enum):
    MOVIE = "movieId"
    CATEGORY = "categoryId"
    NOTE = "note"

    # @classmethod
    # def values(cls):
    #     return [
    #         v for k, v in vars(cls).items() if not k.startswith("_") and not callable(v)
    #     ]


class CategoryColumns(str, Enum):
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


class WatchlistColumns(str, Enum):
    MOVIE = "movieId"
    USER = "userId"
    STATUS = "status"

    # @classmethod
    # def values(cls):
    #     return [
    #         v for k, v in vars(cls).items() if not k.startswith("_") and not callable(v)
    #     ]


class UserColumns(str, Enum):
    ID = "id"
    NAME = "username"
    LETTERBOXD = "letterboxd"
    EMAIL = "email"
    LAST_CHECKED = "lastLetterboxdCheck"  # This is removed before reaching frontend

    # @classmethod
    # def values(cls):
    #     return [
    #         v for k, v in vars(cls).items() if not k.startswith("_") and not callable(v)
    #     ]


class myUserDataColumns(str, Enum):
    PROFILE_PIC = "propic"


class UserStatsColumns(str, Enum):
    NUM_SEEN_SHORT = "numSeenShort"
    NUM_SEEN_FEATURE = "numSeenFeature"
    NUM_TODO_SHORT = "numTodoShort"
    NUM_TODO_FEATURE = "numTodoFeature"
    NUM_SEEN_MULTINOM = "numSeenMultinom"
    NUM_TODO_MULTINOM = "numTodoMultinom"
    SEEN_WATCHTIME = "seenWatchtime"
    TODO_WATCHTIME = "todoWatchtime"


class WatchStatus(str, Enum):
    SEEN = "seen"
    TODO = "todo"
    BLANK = "blank"

    # @classmethod
    # def values(cls):
    #     return [
    #         v for k, v in vars(cls).items() if not k.startswith("_") and not callable(v)
    #     ]


class Grouping(str, Enum):
    BigThree = "big_three"
    Acting = "acting"
    Filmkraft = "filmkraft"
    Art = "art"
    Audio = "audio"
    BestInClass = "best_in_class"
    Short = "short"


__all__ = [
    "MovID",
    "UseID",
    "CatID",
    "MovieDbID",
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
    "myUserDataColumns",
    "UserStatsColumns",
    "Grouping",
    "GeneralDataFlavor",
]
