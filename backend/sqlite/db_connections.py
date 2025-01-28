import sqlite3
import sqlalchemy as sa
from contextlib import contextmanager
from backend.sqlite.db_schema import DB_PATH

try:
    assert DB_PATH is not None and DB_PATH.exists(), "Can't find database file"
    engine = sa.create_engine(f"sqlite:///{DB_PATH}")
except Exception as e:
    print(f"Error creating engine: {e}")
    raise


@contextmanager
def get_connection():
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        yield conn, cursor


Session = sa.orm.sessionmaker(bind=engine)
