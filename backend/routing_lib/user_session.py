from datetime import datetime
from random import random
from flask import session
from enum import Enum

from backend.types.api_schemas import UserID


class UserSession:
    def __init__(self, user_id: UserID):
        self.session_token: int = random.randint(1, 2**32)
        self.user_id: UserID = user_id
        self.session_start: datetime = datetime.now()
        self.last_activity: datetime = datetime.now()
        self.ip_address = None
        self.user_agent = None
        self.last_letterboxd_check = None

    def update_activity(self):
        self.last_activity = datetime.now()


def start_new_session(user_id: UserID):
    session[SessionArgs.user_id.value] = user_id
    session[SessionArgs.last_activity.value] = datetime.now()


def log_session_activity():
    session[SessionArgs.last_activity.value] = datetime.now()


class SessionArgs(Enum):
    user_id = "user_id"
    last_activity = "last_activity"
