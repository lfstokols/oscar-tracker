import logging

import sqlalchemy as sa
from typing_extensions import Literal

from backend.data.db_schema import Category, Movie, Nomination, User, Watchnotice
from backend.types.api_schemas import MovieID, UserID
from backend.types.my_types import WatchStatus


def num_movies_marked() -> sa.Select[tuple[UserID, int, int, int, int]]:
    """
    Gets five columns:
    - user ID
    - the number of feature films seen by a user
    - the number of short films seen by a user
    - the number of feature films todo by a user
    - the number of short films todo by a user
    """
    return (
        sa.select(
            User.user_id,
            sa.func.count(
                sa.case(
                    (
                        sa.and_(
                            Watchnotice.status == WatchStatus.SEEN,
                            ~Movie.is_short,
                        ),
                        1,
                    )
                )
            ).label("num_movies_seen_feature"),
            sa.func.count(
                sa.case(
                    (
                        sa.and_(
                            Watchnotice.status == WatchStatus.SEEN,
                            Movie.is_short,
                        ),
                        1,
                    )
                )
            ).label("num_movies_seen_short"),
            sa.func.count(
                sa.case(
                    (
                        sa.and_(
                            Watchnotice.status == WatchStatus.TODO,
                            ~Movie.is_short,
                        ),
                        1,
                    )
                )
            ).label("num_movies_todo_feature"),
            sa.func.count(
                sa.case(
                    (
                        sa.and_(
                            Watchnotice.status == WatchStatus.TODO,
                            Movie.is_short,
                        ),
                        1,
                    )
                )
            ).label("num_movies_todo_short"),
        )
        .select_from(User)
        .join(User.watchnotices, isouter=True)
        .join(Watchnotice.movie, isouter=True)
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
        status_filter = Watchnotice.status == WatchStatus.SEEN
    elif status == "todo":
        status_filter = Watchnotice.status == WatchStatus.TODO
    else:
        status_filter = sa.or_(
            Watchnotice.status == WatchStatus.SEEN, Watchnotice.status == WatchStatus.TODO)
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

    # * Every entry corresponds to a user watching a movie nominated in that category
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
