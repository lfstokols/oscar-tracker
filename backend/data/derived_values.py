import logging
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


# def movie_is_short() -> sa.Select[tuple[MovieID, str, bool]]:
#     return sa.select(
#         Movie.movie_id,
#         Movie.title,
#         Movie.categories.any(Category.is_short).label("is_short"),
#     )
def movie_is_short() -> sa.Select[tuple[MovieID, bool]]:
    return sa.select(
        Movie.movie_id,
        Movie.categories.any(Category.is_short).label("is_short"),
    )


def movie_is_multinom() -> sa.Select[tuple[MovieID, bool]]:
    return (
        sa.select(
            Movie.movie_id,
            (sa.func.count(Nomination.nomination_id) > 1).label("is_multinom"),
        )
        .select_from(Movie)
        .join(Nomination, Nomination.movie_id == Movie.movie_id, isouter=True)
        .group_by(Movie.movie_id)
    )


def movie_num_noms() -> sa.Select[tuple[MovieID, int]]:
    return (
        sa.select(
            Movie.movie_id,
            sa.func.count(Nomination.nomination_id).label("num_noms"),
        )
        .join(Nomination, Nomination.movie_id == Movie.movie_id, isouter=True)
        .group_by(Movie.movie_id)
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


def num_categories_completed(
    status: WatchStatus, year: int
) -> sa.Select[tuple[UserID, int]]:
    if status == WatchStatus_pyd.SEEN:
        x = 0
    elif status == WatchStatus_pyd.TODO:
        x = 1
    else:
        logging.error(
            f"Tried to use status.BLANK in num_categories_completed, most likely due to writing loop while distracted."
        )
        raise ValueError(
            f"WatchStatus.BLANK is not a valid status for num_categories_completed."
        )
    category_boolean_subquery = (
        sa.select(
            User.user_id,
            Category.category_id,
            sa.case(
                (
                    sa.func.count() == Category.max_nominations,
                    1,
                ),
                else_=0,
            ).label("is_categories_completed"),
        )
        .select_from(User)
        .join(User.watchnotices)
        .where(Watchnotice.year == year)
        .where(
            sa.or_(
                Watchnotice.status == status.value,
                Watchnotice.status == WatchStatus_pyd.SEEN.value,
            )
        )
        .join(Watchnotice.movie)
        .join(Movie.nominations)
        .join(Nomination.category)
        .group_by(User.user_id)
        .group_by(Category.category_id)
        .subquery()
    )
    return (
        sa.select(
            User.user_id,
            sa.func.sum(category_boolean_subquery.c.is_categories_completed).label(
                "num_categories_completed"
            ),
        )
        .join(
            category_boolean_subquery,
            category_boolean_subquery.c.user_id == User.user_id,
        )
        .group_by(User.user_id)
    )
