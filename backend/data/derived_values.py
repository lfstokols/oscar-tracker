import logging
import pandas as pd
from typing_extensions import Literal
import sqlalchemy as sa
from backend.data.db_schema import (
    Movie,
    Nomination,
    Category,
    User,
    Watchnotice,
)
from backend.data.db_connections import Session
from backend.types.api_schemas import (
    UserID,
    MovieID,
    CategoryID,
    WatchStatus_pyd,
)
from backend.types.my_types import WatchStatus


def movie_is_short() -> sa.Select[tuple[MovieID, bool]]:
    return (
        sa.select(
            Nomination.movie_id,
            sa.func.max(Category.is_short).label("is_short"),
        )
        .select_from(Nomination)
        .outerjoin(Category, Nomination.category_id == Category.category_id)
        .group_by(Nomination.movie_id)
    )


def movie_is_multinom() -> sa.Select[tuple[MovieID, bool]]:
    return (
        sa.select(
            Nomination.movie_id,
            (sa.func.count() > 1).label("is_multinom"),
        )
        .select_from(Nomination)
        .group_by(Nomination.movie_id)
    )


def movie_num_noms() -> sa.Select[tuple[MovieID, int]]:
    return (
        sa.select(
            Nomination.movie_id,
            sa.func.count().label("num_noms"),
        )
        .select_from(Nomination)
        .group_by(Nomination.movie_id)
    )


def runtime_formatted() -> sa.Select[tuple[MovieID, int, str]]:
    """
    Gets the runtime in HH:MM format
    by converting the runtime in minutes to hours and minutes.
    """
    return sa.select(
        Movie.movie_id,
        Movie.runtime.cast(sa.Integer).label("runtime_minutes"),
        sa.func.printf("%d:%02d", Movie.runtime // 60, Movie.runtime % 60).label(
            "runtime_hours"
        ),
    ).where(Movie.runtime.isnot(None))


def break_into_subtitles() -> sa.Select[tuple[MovieID, str, str]]:
    """
    Note: The subtitle is not cleaned, it may contain leading colons or etc.
            Must be sanitized before use.
    """
    return sa.select(
        Movie.movie_id,
        sa.case(
            (Movie.subtitle_position == None, Movie.title),
            else_=sa.func.substr(Movie.title, 1, Movie.subtitle_position),
        ).label("main_title"),
        sa.case(
            (Movie.subtitle_position == None, ""),
            else_=sa.func.substr(
                Movie.title, Movie.subtitle_position + 1, sa.func.length(Movie.title)
            ),
        ).label("subtitle"),
    )


def num_movies_marked() -> sa.Select[tuple[UserID, int, int, int, int]]:
    """
    Gets five columns:
    - user ID
    - the number of feature films seen by a user
    - the number of short films seen by a user
    - the number of feature films todo by a user
    - the number of short films todo by a user
    """
    shortness = movie_is_short().subquery()
    return (
        sa.select(
            User.user_id,
            sa.func.count(
                sa.case(
                    (
                        sa.and_(
                            (Watchnotice.status == WatchStatus_pyd.SEEN.value),
                            ~shortness.c.is_short,
                        ),
                        1,
                    )
                )
            ).label("num_movies_seen_feature"),
            sa.func.count(
                sa.case(
                    (
                        sa.and_(
                            (Watchnotice.status == WatchStatus_pyd.SEEN.value),
                            shortness.c.is_short,
                        ),
                        1,
                    )
                )
            ).label("num_movies_seen_short"),
            sa.func.count(
                sa.case(
                    (
                        sa.and_(
                            (Watchnotice.status == WatchStatus_pyd.TODO.value),
                            ~shortness.c.is_short,
                        ),
                        1,
                    )
                )
            ).label("num_movies_todo_feature"),
            sa.func.count(
                sa.case(
                    (
                        sa.and_(
                            (Watchnotice.status == WatchStatus_pyd.TODO.value),
                            shortness.c.is_short,
                        ),
                        1,
                    )
                )
            ).label("num_movies_todo_short"),
        )
        .join(User.watchnotices, isouter=True)
        .join(Watchnotice.movie)
        .join(
            shortness,
            shortness.c.movie_id == Watchnotice.movie_id,
            isouter=True,
        )
        .group_by(User.user_id)
    )


def get_filtered_watchlist(status: Literal["seen", "todo", "both"], year: int) -> sa.Subquery[tuple[UserID, MovieID]]:
    """
    Returns a subquery of the watchlist filtered by status and year.
    No guarantees on a given user existing in the subquery.
    Inputs:
        status: "seen", "todo", or "both"
        year: int
    Returns:
        Subquery, columns:
            user_id: UserID
            movie_id: MovieID
    """
    if status == "seen":
        status_filter = Watchnotice.status == WatchStatus_pyd.SEEN.value
    elif status == "todo":
        status_filter = Watchnotice.status == WatchStatus_pyd.TODO.value
    else:
        status_filter = sa.or_(Watchnotice.status == WatchStatus_pyd.SEEN.value, Watchnotice.status == WatchStatus_pyd.TODO.value)
    return (
        sa.select(
            Watchnotice.user_id,
            Watchnotice.movie_id,
        )
        .select_from(Watchnotice)
        .where(status_filter)
        .where(Watchnotice.year == year)
        .subquery()
    )

def num_categories_completed(
    status: Literal["seen", "both"], year: int
) -> sa.Subquery[tuple[UserID, int]]:
    if status == "seen":
        filtered_watchlist = get_filtered_watchlist("seen", year)
    elif status == "both":
        filtered_watchlist = get_filtered_watchlist("both", year)
    else:
        logging.error(
            f"Tried to use status.BLANK in num_categories_completed, most likely due to writing loop while distracted."
        )
        raise ValueError(
            f"WatchStatus.BLANK is not a valid status for num_categories_completed."
        )
    
    #* Every entry corresponds to a user watching a movie nominated in that category
    category_watchlist = (
        sa.select(
            filtered_watchlist.c.user_id,
            Nomination.category_id,
        )
        .select_from(filtered_watchlist)
        .join(Nomination, filtered_watchlist.c.movie_id == Nomination.movie_id)
        .subquery()
    )
    num_in_cat = (
        sa.select(
            category_watchlist.c.user_id,
            category_watchlist.c.category_id,
            sa.func.count().label("num"),
        )
        .select_from(category_watchlist)
        .group_by(category_watchlist.c.user_id, category_watchlist.c.category_id)
        .subquery()
    )
    completed_categories = (
        sa.select(
            num_in_cat.c.user_id,
            num_in_cat.c.category_id,
        ).select_from(num_in_cat)
        .join(Category, num_in_cat.c.category_id == Category.category_id)
        .where(num_in_cat.c.num == Category.max_nominations)
        .subquery()
    )
    return (
        sa.select(
            User.user_id,
            sa.func.count(completed_categories.c.category_id).label(
                "num_categories_completed"
            ),
        )
        .select_from(User)
        .outerjoin(completed_categories, User.user_id == completed_categories.c.user_id)
        .group_by(User.user_id)
        .subquery()
    )


