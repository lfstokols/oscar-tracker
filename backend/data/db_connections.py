import sqlalchemy as sa
import sqlalchemy.orm as sa_orm
from contextlib import contextmanager
from backend.data.db_schema import DB_PATH, Base
import logging

try:
    assert DB_PATH is not None, "No database path provided"
    if not DB_PATH.exists():
        logging.warning(f"Database file {DB_PATH} does not exist, creating it")
        DB_PATH.touch()
    engine = sa.create_engine(f"sqlite:///{DB_PATH}")
except Exception as e:
    print(f"Error creating engine: {e}")
    raise

try:
    engine.connect()
    Base.metadata.create_all(engine)
except Exception as e:
    print(f"Error creating engine: {e}")
    raise

# @contextmanager
# def get_connection():
#     with sqlite3.connect(DB_PATH) as conn:
#         cursor = conn.cursor()
#         yield conn, cursor


Session = sa_orm.sessionmaker(bind=engine)
