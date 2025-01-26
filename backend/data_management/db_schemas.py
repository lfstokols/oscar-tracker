from enum import Enum


# * Enums
class WatchStatus(Enum):
    SEEN = "seen"
    TODO = "todo"
    BLANK = "blank"


# * Database Schema Models
class db_col_users(Enum):
    user_id = "user_id"
    username = "username"
    letterboxd = "letterboxd"
    email = "email"
    last_letterboxd_check = "last_letterboxd_check"


class db_col_movies(Enum):
    movie_id = "movie_id"
    year = "year"
    title = "title"
    imdb_id = "imdb_id"
    movie_db_id = "movie_db_id"
    runtime = "runtime"
    poster_path = "poster_path"
    subtitle_position = "subtitle_position"


class db_col_categories(Enum):
    category_id = "category_id"
    short_name = "short_name"
    full_name = "full_name"
    has_note = "has_note"
    is_short = "is_short"
    grouping = "grouping"
    max_nominations = "max_nominations"


class db_col_nominations(Enum):
    movie_id = "movie_id"
    category_id = "category_id"
    note = "note"


class db_col_watchlist(Enum):
    user_id = "user_id"
    movie_id = "movie_id"
    status = "status"
