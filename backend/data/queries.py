import logging
from typing import Any, cast

import httpx
import sqlalchemy as sa
from bs4 import BeautifulSoup, Tag
from sqlalchemy.orm import selectinload
from typing_extensions import Literal

import backend.data.derived_values as dv
from backend.data.db_connections import Session
from backend.data.db_schema import Category, Movie, Nomination, User, Watchnotice
from backend.data.utils import result_to_dict
from backend.types.api_schemas import CategoryCompletionKey, MovieID, UserID, countTypes
from backend.types.my_types import Grouping, WatchStatus


def get_number_of_movies(year: int, shortsIsOne: bool = False) -> int:
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
                sa.select(sa.func.sum(Category.max_nominations)
                          ).where(Category.is_short)
            ).scalar_one()
            num_short_categories = session.execute(
                sa.select(sa.func.count(Category.category_id)
                          ).where(Category.is_short)
            ).scalar_one()
            return total - num_short_films + num_short_categories
        return total


def get_movies(year: int, idList: list[MovieID] | None = None) -> list[Movie]:
    """
    Returns a list of Movie ORM objects for a given year.
    Use api_Movie.model_validate(movie) at the API boundary for serialization.
    """
    query = (
        sa.select(Movie)
        .where(Movie.year == year)
        .options(
            selectinload(Movie.nominations).selectinload(Nomination.category)
        )
    )
    if idList:
        query = query.where(Movie.movie_id.in_(idList))
    with Session() as session:
        movies = list(session.execute(query).scalars().all())
        # Expunge from session so hybrid properties remain accessible after session closes
        for movie in movies:
            session.expunge(movie)
        return movies


def get_users(idList: list[UserID] | None = None) -> list[dict[str, Any]]:
    query = sa.select(User.user_id.label(
        "id"), User.username).select_from(User)
    if idList:
        query = query.where(User.user_id.in_(idList))
    with Session() as session:
        result = session.execute(query)
        return result_to_dict(result)


async def get_my_user_data(userId: UserID) -> dict[str, Any]:
    query = sa.select(
        User.user_id.label("id"),
        User.username,
        User.letterboxd,
        User.email,
    ).select_from(User)
    query = query.where(User.user_id == userId)
    with Session() as session:
        result = session.execute(query)
        data = result_to_dict(result)
    if data is None or len(data) == 0:
        logging.error(
            f"User with id {userId} not found @ qu.get_my_user_data({userId})"
        )
        raise Exception(
            f"User with id {userId} not found @ qu.get_my_user_data({userId})"
        )
    data = data[0]
    data["propic"] = await get_user_propic(data["letterboxd"])
    return data


async def get_user_propic(letterboxd_username: str | None) -> str | None:
    if letterboxd_username is None:
        return None
    try:
        # Get the user's letterboxd profile page
        url = f"https://letterboxd.com/{letterboxd_username}/"
        async with httpx.AsyncClient() as client:
            response = (await client.get(url)).raise_for_status()
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
    except (httpx.HTTPStatusError, AttributeError) as e:
        logging.error(
            f"Error getting user propic for {letterboxd_username}", e)
        return None


def get_category_completion_dict(
    year: int,
) -> dict[UserID, dict[CategoryCompletionKey, dict[countTypes, int]]]:
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
        sa.select(User.user_id.label("user_id"),
                  Watchnotice.movie_id.label("movie_id"))
        .select_from(User)
        .outerjoin(
            Watchnotice,
            sa.and_(
                User.user_id == Watchnotice.user_id,
                Watchnotice.year == year,
                Watchnotice.status == WatchStatus.SEEN,
            ),
        )
        .subquery()
    )
    todo_watchlist = (
        sa.select(User.user_id.label("user_id"),
                  Watchnotice.movie_id.label("movie_id"))
        .select_from(User)
        .outerjoin(
            Watchnotice,
            sa.and_(
                User.user_id == Watchnotice.user_id,
                Watchnotice.year == year,
                Watchnotice.status == WatchStatus.TODO,
            ),
        )
        .subquery()
    )
    all_movies = (
        sa.select(User.user_id.label("user_id"),
                  Movie.movie_id.label("movie_id"))
        .select_from(User)
        .join(Movie, sa.true())  # * Cartesian product
        .where(Movie.year == year)
        .subquery()
    )

    relevant_movie_data = (
        sa.select(
            Nomination.movie_id.label("movie_id"),
            Nomination.category_id.label("category_id"),
            Category.grouping.label("grouping"),
        )
        .select_from(Nomination)
        .outerjoin(Category)
        .where(Nomination.year == year)
        # .group_by(Nomination.movie_id)
        .subquery()
    )

    def query(status: countTypes):
        start = {
            "seen": seen_watchlist,
            "todo": todo_watchlist,
            "total": all_movies,
        }[status]
        return (
            sa.select(
                start.c.user_id.label("id"),
                *[
                    sa.func.count(sa.func.distinct(start.c.movie_id))
                    .filter(relevant_movie_data.c.category_id == cat)
                    .label(str(cat))
                    for cat in all_categories
                ],
                *[
                    sa.func.count(sa.func.distinct(start.c.movie_id))
                    .filter(relevant_movie_data.c.grouping == grp)
                    .label(str(grp))
                    for grp in all_groupings
                ],
            )
            .select_from(start)
            .outerjoin(
                relevant_movie_data, start.c.movie_id == relevant_movie_data.c.movie_id
            )
            .group_by(start.c.user_id)
        )

    with Session() as session:
        seen_result = session.execute(query("seen"))
        todo_result = session.execute(query("todo"))
        total_result = session.execute(query("total"))
        seen_data = result_to_dict(seen_result)
        todo_data = result_to_dict(todo_result)
        total_data = result_to_dict(total_result)

        # seen_intermediate = session.execute(seen_watchlist.select())
        # todo_intermediate = session.execute(todo_watchlist.select())
        # total_intermediate = session.execute(all_movies.select())
        # relevant_movie_data_intermediate = session.execute(relevant_movie_data.select())
    return format_category_completion_dict(seen_data, todo_data, total_data)
    # return seen_data, todo_data, total_data


type _CategoryCompletionDict = dict[CategoryCompletionKey | Literal["id"], int]


def format_category_completion_dict(
    seen_data: list[_CategoryCompletionDict],
    todo_data: list[_CategoryCompletionDict],
    total_data: list[_CategoryCompletionDict],
) -> dict[UserID, dict[CategoryCompletionKey, dict[countTypes, int]]]:
    result: dict[UserID, dict[countTypes,
                              dict[CategoryCompletionKey, int]]] = {}
    for row in seen_data:
        user_id = cast(UserID, row.pop("id"))
        result[user_id] = {"seen": row}
    for row in todo_data:
        user_id = cast(UserID, row.pop("id"))
        if user_id not in result:
            result[user_id] = {}
        result[user_id]["todo"] = row
    for row in total_data:
        user_id = cast(UserID, row.pop("id"))
        if user_id not in result:
            result[user_id] = {}
        result[user_id]["total"] = row
    output: dict[UserID, dict[CategoryCompletionKey,
                              dict[countTypes, int]]] = {}
    for user_id in result:
        output[user_id] = {
            key: {
                "seen": result[user_id]["seen"][key],
                "todo": result[user_id]["todo"][key],
                "total": result[user_id]["total"][key],
            }
            for key in result[user_id]["seen"]
        }
    return output


def get_user_stats(year: int) -> list[dict[str, Any]]:
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

    def query_by_status(status: Literal["seen", "todo"]):
        watchlist = dv.get_filtered_watchlist(status, year)
        num_cats = dv.num_categories_completed(
            ("seen" if status == "seen" else "both"), year
        )
        label = "Seen" if status == "seen" else "Todo"
        return (
            sa.select(
                User.user_id.label("id"),
                sa.func.count(watchlist.c.movie_id)
                .filter(Movie.is_short)
                .label(f"num{label}Short"),
                sa.func.count(watchlist.c.movie_id)
                .filter(~Movie.is_short)
                .label(f"num{label}Feature"),
                sa.func.count(watchlist.c.movie_id)
                .filter(Movie.is_multinom)
                .label(f"num{label}Multinom"),
                num_cats.c.num_categories_completed.label(f"numCats{label}"),
                sa.func.sum(Movie.runtime).label(f"{label.lower()}Watchtime"),
            )
            .select_from(User)
            .outerjoin(watchlist, User.user_id == watchlist.c.user_id)
            .outerjoin(Movie, watchlist.c.movie_id == Movie.movie_id)
            .outerjoin(num_cats, watchlist.c.user_id == num_cats.c.user_id)
            .group_by(User.user_id)
            .subquery()
        )

    seen_query = query_by_status("seen")
    todo_query = query_by_status("todo")
    full_query = (
        sa.select(seen_query, todo_query)
        .select_from(seen_query)
        .join(todo_query, seen_query.c.id == todo_query.c.id)
    )
    with Session() as session:
        result = session.execute(full_query)
        return result_to_dict(result)


def get_noms(year: int) -> list[dict[str, Any]]:
    with Session() as session:
        result = session.execute(
            sa.select(
                Nomination.movie_id.label("movieId"),
                Nomination.category_id.label("categoryId"),
                Nomination.note.label("note"),
            ).where(Nomination.year == year)
        )
        return result_to_dict(result)


def get_watchlist(year: int) -> list[dict[str, Any]]:
    with Session() as session:
        result = session.execute(
            sa.select(
                Watchnotice.user_id.label("userId"),
                Watchnotice.movie_id.label("movieId"),
                Watchnotice.status.label("status"),
            ).where(Watchnotice.year == year)
        )
        return result_to_dict(result)


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
        return result_to_dict(result)
