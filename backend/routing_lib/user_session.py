import logging
from datetime import datetime, timedelta
from enum import Enum

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from backend.scheduled_tasks.check_rss import update_user_watchlist
from backend.types.api_schemas import UserID
from backend.types.api_validators import validate_user_id


class UserSession:
    delta_minutes_inactive = 20

    def __init__(self, request: Request):
        self.session = request.session

    def start_new(self, user_id: UserID) -> None:
        self.session[_SessionArgs.user_id.value] = user_id
        self.session[_SessionArgs.last_activity.value] = datetime.now()

    def end(self) -> None:
        self.session[_SessionArgs.user_id.value] = None
        self.session[_SessionArgs.last_activity.value] = None

    def log_activity(self) -> None:
        self.session[_SessionArgs.last_activity.value] = datetime.now()

    def is_time_to_update(self) -> bool:
        last_activity = self.session.get(_SessionArgs.last_activity.value, datetime.min)
        time_since_last_activity = datetime.now() - last_activity
        return time_since_last_activity > timedelta(
            minutes=UserSession.delta_minutes_inactive
        )

    def id_matches_session(self, user_id: UserID) -> bool:
        return self.session.get(_SessionArgs.user_id.value) == user_id

    def session_added_user(self) -> None:
        if _SessionArgs.new_user_additions.value not in self.session:
            self.session[_SessionArgs.new_user_additions.value] = []
        self.session[_SessionArgs.new_user_additions.value].append(datetime.now())


class _SessionArgs(Enum):
    user_id = "user_id"
    last_activity = "last_activity"
    new_user_additions = "new_user_additions"


class SessionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if not hasattr(request, "session"):
            logging.error(
                "Request has no session, I think the order of middlewares is wrong."
            )
            return await call_next(request)
        session = UserSession(request)
        # Check if the user is logged in
        login = request.cookies.get("activeUserId")
        if login is None or login == "":
            # If they aren't logged in, not part of any session, nothing to do
            return await call_next(request)
        # Is the user logged into a *valid* session?
        id, code = validate_user_id(login)
        if code != 0:
            logging.error(f"Invalid user id {login} found in cookie.")
            session.end()
            request.state.should_delete_cookie = True
            return await call_next(request)
        # Is this the same login data from the last request?
        if session.id_matches_session(id):
            session.log_activity()
        else:
            session.start_new(id)
        # Is it time to update the user's watchlist?
        if session.is_time_to_update():
            update_user_watchlist(id)
        return await call_next(request)
