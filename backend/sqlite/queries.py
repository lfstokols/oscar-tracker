import logging
from typing import Any
import requests
from bs4 import BeautifulSoup, Tag
import sqlalchemy as sa
from backend.sqlite.db_schema import User, Movie, Category, Nomination, Watchnotice
from backend.types.api_schemas import (
    MovieID,
    CategoryCompletionKey,
    UserID,
)
from backend.types.my_types import WatchStatus, Grouping
from backend.sqlite.db_connections import Session
import backend.sqlite.derived_values as dv


def get_number_of_movies(year, shortsIsOne=False) -> int:
    """
    Assumes the short categories are mutually exclusive with each other,
    and with all other categories.
    I.e. nothing can be a documentary short _and_ an animated short, and no
    short is elligible for e.g. Best Sound
    """
    with Session() as session:
        total = session.execute(
            sa.select(sa.func.count(Movie.movie_id)).where(Movie.year == year)
        ).scalar_one()
        if shortsIsOne:
            num_short_films = session.execute(
                sa.select(sa.func.sum(Category.max_noms)).where(Category.is_short)
            ).scalar_one()
            num_short_categories = session.execute(
                sa.select(sa.func.count(Category.category_id)).where(Category.is_short)
            ).scalar_one()
            return total - num_short_films + num_short_categories
        return total


def get_movies(year, idList: list[MovieID] | None = None) -> list[dict[str, Any]]:
    """
    Returns an array of movies for a given year.
    Each movie is a dictionary with the following keys:
        - id: MovieID
        - title: str
        - main_title: str
        - subtitle: str
        - ImdbId: str
        - movieDbId: int
        - runtime_hours: str
        - runtime_minutes: int
        - numNoms: int
        - isShort: bool
        - posterPath: str
    """
    shortness = dv.movie_is_short().subquery()
    formatted_runtimes = dv.runtime_formatted().subquery()
    main_and_subtitles = dv.break_into_subtitles().subquery()
    num_noms = dv.movie_num_noms().subquery()
    query = (
        sa.select(
            Movie.movie_id.label("id"),
            Movie.title,
            main_and_subtitles.c.main_title.label("mainTitle"),
            main_and_subtitles.c.subtitle,
            Movie.imdb_id.label("ImdbId"),
            Movie.movie_db_id.label("movieDbId"),
            formatted_runtimes.c.runtime_hours,
            formatted_runtimes.c.runtime_minutes,
            num_noms.c.num_noms.label("numNoms").cast(sa.Integer),
            shortness.c.is_short.label("isShort"),
            Movie.poster_path.label("posterPath"),
        )
        .select_from(Movie)
        .join(shortness, Movie.movie_id == shortness.c.movie_id, isouter=True)
        .join(
            formatted_runtimes,
            Movie.movie_id == formatted_runtimes.c.movie_id,
            isouter=True,
        )
        .join(
            main_and_subtitles,
            Movie.movie_id == main_and_subtitles.c.movie_id,
            isouter=True,
        )
        .join(num_noms, Movie.movie_id == num_noms.c.movie_id, isouter=True)
    )
    query = query.where(Movie.year == year)
    if idList:
        query = query.where(Movie.movie_id.in_(idList))
    with Session() as session:
        result = session.execute(query)
        return [dict(zip(result.keys(), row)) for row in result.fetchall()]


def get_users(idList: list[UserID] | None = None) -> list[dict[str, Any]]:
    query = sa.select(User.user_id.label("id"), User.username).select_from(User)
    if idList:
        query = query.where(User.user_id.in_(idList))
    with Session() as session:
        result = session.execute(query)
    return [dict(zip(result.keys(), row)) for row in result.fetchall()]


def get_my_user_data(userId: UserID) -> dict[str, Any]:
    query = sa.select(
        User.user_id.label("id"),
        User.username,
        User.letterboxd,
        User.email,
    ).select_from(User)
    query = query.where(User.user_id == userId)
    with Session() as session:
        result = session.execute(query)
        result = dict(zip(result.keys(), result.fetchone()))
    assert result is not None, f"User with id {userId} not found <in get_my_user_data>"
    result["propic"] = get_user_propic(result["letterboxd"])
    return result


def get_user_propic(letterboxd_username: str | None) -> str | None:
    if letterboxd_username is None:
        return None
    try:
        # Get the user's letterboxd profile page
        url = f"https://letterboxd.com/{letterboxd_username}/"
        response = requests.get(url)
        response.raise_for_status()
        # Parse the HTML
        soup = BeautifulSoup(response.text, "html.parser")
        # Find the avatar image
        avatar = soup.find("div", class_="profile-avatar")
        avatar = avatar.find("img") if avatar else None
        if (
            avatar
            and isinstance(avatar, Tag)
            and hasattr(avatar, "attrs")
            and "src" in avatar.attrs
        ):
            return avatar.attrs["src"]
        return None
    except (requests.RequestException, AttributeError) as e:
        logging.error(f"Error getting user propic for {letterboxd_username}", e)
        return None


def get_category_completion_dict(
    year: int,
) -> dict[UserID, list[dict[CategoryCompletionKey, int]]]:
    """
    This is for the 'by category' view.
    Returns a dict with keys as UserIDs and values as
            dicts with mapping category names + etc to ints
            representing the number of movies seen in that 'category'
    """
    all_groupings = [g.value for g in Grouping]

    with Session() as session:
        result = session.execute(sa.select(Category.category_id)).fetchall()
    all_categories = [c for c, in result]

    seen_watchlist = (
        sa.select(User, Watchnotice)
        .select_from(User)
        .join(Watchnotice, User.user_id == Watchnotice.user_id, isouter=True)
        .where(Watchnotice.year == year)
        .where(Watchnotice.status == WatchStatus.SEEN.value)
        .subquery()
    )
    todo_watchlist = (
        sa.select(User, Watchnotice)
        .select_from(User)
        .join(Watchnotice, User.user_id == Watchnotice.user_id, isouter=True)
        .where(Watchnotice.year == year)
        .subquery()
    )

    def query(status: WatchStatus):
        start = seen_watchlist if status == WatchStatus.SEEN else todo_watchlist
        return (
            sa.select(
                start.c.user_id.label("id"),
                *[
                    sa.func.count(Movie.movie_id)
                    .filter(Nomination.category_id == c)
                    .label(str(c))
                    for c in all_categories
                ],
                *[
                    sa.func.count(Movie.movie_id)
                    .filter(Category.grouping == g)
                    .label(str(g))
                    for g in all_groupings
                ],
            )
            .select_from(start)
            .join(Movie, start.c.movie_id == Movie.movie_id, isouter=True)
            .join(Nomination, Movie.movie_id == Nomination.movie_id, isouter=True)
            .join(
                Category, Nomination.category_id == Category.category_id, isouter=True
            )
            .group_by(start.c.user_id)
        )

    with Session() as session:
        seen_result = session.execute(query(WatchStatus.SEEN))
        todo_result = session.execute(query(WatchStatus.TODO))
        seen_data = [
            dict(zip(seen_result.keys(), row)) for row in seen_result.fetchall()
        ]
        todo_data = [
            dict(zip(todo_result.keys(), row)) for row in todo_result.fetchall()
        ]
    return format_category_completion_dict(seen_data, todo_data)


def format_category_completion_dict(
    seen_data: list[dict[CategoryCompletionKey | UserID, int]],
    todo_data: list[dict[CategoryCompletionKey | UserID, int]],
) -> dict[UserID, list[dict[CategoryCompletionKey, int]]]:
    result = {}
    for row in seen_data:
        user_id = row.pop("id")
        result[user_id] = [row]
    for row in todo_data:
        user_id = row.pop("id")
        result[user_id].append(row)
    return result


def compute_user_stats(year: int) -> list[dict[str, Any]]:
    """
    finds the total number of movies seen and todo by a user
    If the movie list has complete runtime data,
    it also finds the total seen watchtime and the total todo watchtime

    Returns: Dataframe with columns:
        index: UserID
        num_seen_short: int
        num_seen_feature: int
        num_todo_short: int
        num_todo_feature: int
        num_seen_multinom: int
        num_todo_multinom: int
        total_seen_runtime: int (minutes)
        total_todo_runtime: int (minutes)
        multinom_seen: int
        multinom_todo: int

    """

    shortness = dv.movie_is_short().subquery()
    multinom = dv.movie_is_multinom().subquery()
    num_cats_seen = dv.num_categories_completed(WatchStatus.SEEN, year).subquery()
    num_cats_todo = dv.num_categories_completed(WatchStatus.TODO, year).subquery()

    seen_watchlist = (
        sa.select(User, Watchnotice)
        .select_from(User)
        .join(User.watchnotices)
        .where(Watchnotice.year == year)
        .where(Watchnotice.status == WatchStatus.SEEN.value)
        .subquery()
    )
    todo_watchlist = (
        sa.select(User, Watchnotice)
        .select_from(User)
        .join(Watchnotice)
        .where(Watchnotice.year == year)
        .where(Watchnotice.status == WatchStatus.TODO.value)
        .subquery()
    )

    def query_by_status(status: WatchStatus):
        start = seen_watchlist if status == WatchStatus.SEEN else todo_watchlist
        num_cats = dv.num_categories_completed(status, year).subquery()
        label = "Seen" if status == WatchStatus.SEEN else "Todo"
        return (
            sa.select(
                start.c.user_id.label("id"),
                sa.func.count(Movie.movie_id)
                .filter(shortness.c.is_short)
                .label(f"num{label}Short"),
                sa.func.count(Movie.movie_id)
                .filter(~shortness.c.is_short)
                .label(f"num{label}Feature"),
                sa.func.count(Movie.movie_id)
                .filter(multinom.c.is_multinom)
                .label(f"num{label}Multinom"),
                num_cats.c.num_categories_completed.label(f"numCats{label}"),
                sa.func.sum(Movie.runtime).label(f"{label.lower()}Watchtime"),
            )
            .select_from(start)
            .join(Movie, start.c.movie_id == Movie.movie_id)
            .join(shortness, Movie.movie_id == shortness.c.movie_id)
            .join(multinom, Movie.movie_id == multinom.c.movie_id)
            .join(num_cats, start.c.user_id == num_cats.c.user_id)
            .group_by(start.c.user_id)
        )

    seen_query = query_by_status(WatchStatus.SEEN).subquery()
    todo_query = query_by_status(WatchStatus.TODO).subquery()
    full_query = (
        sa.select(
            seen_query.c.id,
            seen_query.c.numSeenShort,
            seen_query.c.numSeenFeature,
            seen_query.c.numSeenMultinom,
            seen_query.c.seenWatchtime,
            todo_query.c.numTodoShort,
            todo_query.c.numTodoFeature,
            todo_query.c.numTodoMultinom,
            todo_query.c.todoWatchtime,
        )
        .select_from(seen_query)
        .join(todo_query, seen_query.c.id == todo_query.c.id)
    )
    with Session() as session:
        result = session.execute(full_query)
        return [dict(zip(result.keys(), row)) for row in result.fetchall()]


def get_user_stats(year: int) -> list[dict[str, Any]]:
    return compute_user_stats(year)


def get_noms(year: int) -> list[dict[str, Any]]:
    with Session() as session:
        result = session.execute(
            sa.select(
                Nomination.movie_id.label("movieId"),
                Nomination.category_id.label("categoryId"),
                Nomination.note.label("note"),
            ).where(Nomination.year == year)
        )
        return [dict(zip(result.keys(), row)) for row in result.fetchall()]


def get_watchlist(year: int) -> list[dict[str, Any]]:
    with Session() as session:
        result = session.execute(
            sa.select(
                Watchnotice.user_id.label("userId"),
                Watchnotice.movie_id.label("movieId"),
                Watchnotice.status.label("status"),
            ).where(Watchnotice.year == year)
        )
        return [dict(zip(result.keys(), row)) for row in result.fetchall()]


def get_categories() -> list[dict[str, Any]]:
    with Session() as session:
        result = session.execute(
            sa.select(
                Category.category_id.label("id"),
                Category.short_name.label("shortName"),
                Category.full_name.label("fullName"),
                Category.max_nominations.label("maxNoms"),
                Category.is_short.label("isShort"),
                Category.has_note.label("hasNote"),
                Category.grouping.label("grouping"),
            )
        )
        return [dict(zip(result.keys(), row)) for row in result.fetchall()]
