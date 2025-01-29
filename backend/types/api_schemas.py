from pydantic import (
    BaseModel,
    StringConstraints,
    Field,
    HttpUrl,
    EmailStr,
    RootModel,
)
from typing import Optional, Annotated, Literal, Union
from enum import Enum
import backend.types.my_types as my_types

# * Primitives
MovieID = Annotated[str, StringConstraints(pattern=r"^mov_[0-9a-f]{6}$")]
UserID = Annotated[str, StringConstraints(pattern=r"^usr_[0-9a-f]{6}$")]
CategoryID = Annotated[str, StringConstraints(pattern=r"^cat_[a-z]{4}$")]
PosterPath = Annotated[str, StringConstraints(pattern=r"^/[0-9a-zA-Z]*\.jpg$")]


# * Enums
# class WatchStatus_pyd(str, Enum):
#     SEEN = "seen"
#     TODO = "todo"
#     BLANK = "blank"
WatchStatus_pyd = my_types.WatchStatus


class Grouping_pyd(str, Enum):
    BIG_THREE = "big_three"
    ACTING = "acting"
    FILMKRAFT = "filmkraft"
    ART = "art"
    AUDIO = "audio"
    BEST_IN_CLASS = "best_in_class"
    SHORT = "short"


class Flavor(str, Enum):
    MOVIES = "movies"
    USERS = "users"
    NOMINATIONS = "nominations"
    WATCHLIST = "watchlist"
    CATEGORIES = "categories"


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
    mainTitle: str
    subtitle: str
    ImdbId: Optional[str] = None
    movieDbId: Optional[int] = None
    runtime_hours: Optional[str] = None
    runtime_minutes: Optional[int] = None
    numNoms: int = Field(ge=1)
    isShort: bool
    posterPath: Optional[str] = None


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
    status: WatchStatus_pyd


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
    numCatsSeen: Optional[int] = Field(default=0)
    numCatsTodo: Optional[int] = Field(default=0)
    seenWatchtime: Optional[int] = Field(default=0)
    todoWatchtime: Optional[int] = Field(default=0)


class api_UserStatsList(BaseModel):
    data: list[api_UserStats]
    total_count: int


CategoryCompletionKey = Annotated[
    Union[CategoryID, Grouping_pyd],
    "Valid keys for category completions",
]
countTypes = Literal["seen", "todo", "total"]


class api_CategoryCompletions(RootModel):
    root: dict[CategoryCompletionKey, dict[countTypes, int]]


class api_CategoryCompletionsDict(RootModel):
    root: dict[UserID, api_CategoryCompletions]
