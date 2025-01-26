import sqlalchemy as sa
from backend.sqlite.make_db import (
    get_connection,
    Movies,
    Nominations,
    Categories,
    Users,
    Watchlist,
)
from backend.data_management.db_schemas import (
    db_col_users,
    db_col_movies,
    db_col_categories,
    db_col_nominations,
    db_col_watchlist,
)
from backend.types.api_schemas import (
    UserID,
    MovieID,
    CategoryID,
    WatchStatus,
)


def movie_is_short(movie_id: MovieID | sa.Column[MovieID]) -> sa.Column[bool]:
    query = (
        sa.select(Movies)
        .join(Nominations, Movies.movie_id == Nominations.movie_id)
        .join(Categories, Nominations.category_id == Categories.category_id)
        .where(Categories.is_short == True)
        .where(Movies.movie_id == movie_id)
        .exists()
        .label("is_short")
    )
    return query.scalar()


def runtime_hours(movie_id: MovieID):
    """
    Gets the runtime in HH:MM format
    by converting the runtime in minutes to hours and minutes.
    """
    query = (
        sa.select(Movies)
        .where(Movies.movie_id == movie_id)
        .with_only_columns(sa.func.strftime("%H:%M", Movies.runtime))
        .label("runtime_hours")
    )
    return query.scalar()


def num_movies_marked(user_id: UserID) -> sa.Select:
    """
    Gets four columns:
    - the number of feature films seen by a user
    - the number of short films seen by a user
    - the number of feature films todo by a user
    - the number of short films todo by a user
    """
    query = (
        sa.select(
            sa.func.sum(
                sa.case((Watchlist.watch_status == WatchStatus.SEEN, 1), else_=0)
                * sa.case((~movie_is_short(Movies.movie_id), 1), else_=0)
            ).label("num_movies_seen_feature"),
            sa.func.sum(
                sa.case((Watchlist.watch_status == WatchStatus.SEEN, 1), else_=0)
                * sa.case((movie_is_short(Movies.movie_id), 1), else_=0)
            ).label("num_movies_seen_short"),
            sa.func.sum(
                sa.case((Watchlist.watch_status == WatchStatus.TODO, 1), else_=0)
                * sa.case((~movie_is_short(Movies.movie_id), 1), else_=0)
            ).label("num_movies_todo_feature"),
            sa.func.sum(
                sa.case((Watchlist.watch_status == WatchStatus.TODO, 1), else_=0)
                * sa.case((movie_is_short(Movies.movie_id), 1), else_=0)
            ).label("num_movies_todo_short"),
        )
        .select_from(Users)
        .join(Watchlist, Users.user_id == Watchlist.user_id)
        .join(Movies, Watchlist.movie_id == Movies.movie_id)
        .where(Users.user_id == user_id)
        .group_by(Users.user_id)
    )
    return query
