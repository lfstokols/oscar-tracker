from datetime import datetime, timedelta
from random import random
from flask import session
from enum import Enum
from backend.types.api_schemas import UserID


class UserSession:
    delta_minutes_inactive = 20

    @staticmethod
    def start_new(user_id: UserID) -> None:
        session[_SessionArgs.user_id.value] = user_id
        session[_SessionArgs.last_activity.value] = datetime.now()

    @staticmethod
    def end() -> None:
        session[_SessionArgs.user_id.value] = None
        session[_SessionArgs.last_activity.value] = None
    
    @staticmethod
    def log_activity() -> None:
        session[_SessionArgs.last_activity.value] = datetime.now()

    @staticmethod
    def is_time_to_update() -> bool:
        last_activity = session.get(_SessionArgs.last_activity.value, datetime.min)
        time_since_last_activity = datetime.now() - last_activity
        return time_since_last_activity > timedelta(minutes=UserSession.delta_minutes_inactive)

    @staticmethod
    def id_matches_session(user_id: UserID) -> bool:
        return session.get(_SessionArgs.user_id.value) == user_id

    @staticmethod
    def session_added_user() -> None:
        if _SessionArgs.new_user_additions.value not in session:
            session[_SessionArgs.new_user_additions.value] = []
        session[_SessionArgs.new_user_additions.value].append(datetime.now())

class _SessionArgs(Enum):
    user_id = "user_id"
    last_activity = "last_activity"
    new_user_additions = "new_user_additions"
