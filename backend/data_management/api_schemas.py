from pydantic import (
    BaseModel,
    StringConstraints,
    Field,
    HttpUrl,
    EmailStr,
    RootModel,
)
from datetime import datetime
from typing import Optional, Annotated, Literal, Union, KeysView
from enum import Enum

from backend.logic.MyTypes import UserStatsColumns


# * Primitives
MovieID = Annotated[str, StringConstraints(pattern=r"^mov_[0-9a-f]{6}$")]
UserID = Annotated[str, StringConstraints(pattern=r"^usr_[0-9a-f]{6}$")]
CategoryID = Annotated[str, StringConstraints(pattern=r"^cat_[a-z]{4}$")]


# * Enums
class WatchStatus(str, Enum):
    SEEN = "seen"
    TODO = "todo"
    BLANK = "blank"


class Grouping_pyd(str, Enum):
    BIG_THREE = "Big Three"
    ACTING = "Acting"
    FILMKRAFT = "Technical (Filmkraft)"
    ART = "Technical (Art)"
    AUDIO = "Technical (Audio)"
    BEST_IN_CLASS = "Best in Class"
    SHORT = "Short"


class Flavor(str, Enum):
    MOVIES = "movies"
    USERS = "users"
    NOMINATIONS = "nominations"
    WATCHLIST = "watchlist"
    CATEGORIES = "categories"


# * Database Models (matching CSV storage)
class db_User(BaseModel):
    id: UserID
    username: str
    letterboxd: str
    email: EmailStr


class db_Movie(BaseModel):
    id: MovieID
    title: str
    ImdbId: Optional[str] = None
    movieDbId: Optional[int] = None
    runtime: Optional[int] = None  # Stored in minutes
    posterPath: Optional[str] = None


class db_Category(BaseModel):
    id: CategoryID
    shortName: str
    fullName: str
    hasNote: bool
    isShort: bool
    grouping: Grouping_pyd
    maxNoms: Literal[5, 10]


class db_Nom(BaseModel):
    movieId: MovieID
    categoryId: CategoryID
    note: Optional[str] = None


class db_Watchlist(BaseModel):
    userId: UserID
    movieId: MovieID
    status: WatchStatus


# * API Response Models
class api_User(BaseModel):
    id: UserID
    username: str
    propic: Optional[HttpUrl] = None


class api_UserList(BaseModel):
    data: list[api_User]
    total_count: int


class api_Movie(BaseModel):
    id: MovieID
    title: str
    ImdbId: Optional[str] = None
    movieDbId: Optional[int] = None
    runtime_hours: Optional[str] = None
    runtime_minutes: Optional[int] = None
    numNoms: int = Field(ge=1)
    isShort: bool
    posterPath: Optional[HttpUrl] = None


class api_MovieList(BaseModel):
    data: list[api_Movie]
    total_count: int


class api_Nom(BaseModel):
    movieId: MovieID
    categoryId: CategoryID
    note: Optional[str] = ""


class api_Category(BaseModel):
    id: CategoryID
    shortName: str
    fullName: str
    hasNote: bool
    isShort: bool
    grouping: Grouping_pyd
    maxNoms: Literal[5, 10]


class api_WatchNotice(BaseModel):
    userId: UserID
    movieId: MovieID
    status: WatchStatus


class api_CategoryList(BaseModel):
    data: list[api_Category]
    total_count: int


class api_NomList(BaseModel):
    data: list[api_Nom]
    total_count: int


class api_WatchList(BaseModel):
    data: list[api_WatchNotice]
    total_count: int


# * Extended API Models
class api_MyUserData(api_User):
    letterboxd: Optional[str] = None
    email: Optional[EmailStr] = None
    propic: Optional[HttpUrl] = None


class api_UserStats(BaseModel):
    id: UserID
    numSeenShort: Optional[int] = Field(default=0)
    numSeenFeature: Optional[int] = Field(default=0)
    numTodoShort: Optional[int] = Field(default=0)
    numTodoFeature: Optional[int] = Field(default=0)
    numSeenMultinom: Optional[int] = Field(default=0)
    numTodoMultinom: Optional[int] = Field(default=0)
    seenWatchtime: Optional[int] = Field(default=0)
    todoWatchtime: Optional[int] = Field(default=0)


class api_UserStatsList(BaseModel):
    data: list[api_UserStats]
    total_count: int


CategoryCompletionKey = Annotated[
    Union[CategoryID, Grouping_pyd, Literal["numCats"]],
    "Valid keys for category completions",
]


class api_CategoryCompletions(RootModel):
    root: dict[CategoryCompletionKey, int]


class api_CategoryCompletionsDict(RootModel):
    root: dict[UserID, list[api_CategoryCompletions]]
