import logging

import sqlalchemy as sa
import sqlalchemy.orm as sa_orm
from sqlalchemy.pool import NullPool

from backend.data.db_schema import DB_PATH, Base

try:
    if DB_PATH is None:
        logging.error(
            "No database path found in db_schema.py when importing db_connections"
        )
        raise Exception("No database path provided")
    if not DB_PATH.exists():
        logging.warning(f"Database file {DB_PATH} does not exist, creating it")
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        DB_PATH.touch()
    engine = sa.create_engine(
        f"sqlite:///{DB_PATH}",
        connect_args={"check_same_thread": False, "timeout": 30},
        poolclass=NullPool,
    )
except Exception as e:
    logging.error(f"Error creating engine: {e}")
    raise

try:
    with engine.connect():
        Base.metadata.create_all(engine)
except Exception as e:
    logging.error(f"Error creating engine: {e}")
    raise
try:
    with engine.connect() as conn:
        _ = conn.execute(sa.text("PRAGMA journal_mode=WAL"))
except Exception as e:
    logging.error(f"Error setting journal mode: {e}")


Session = sa_orm.sessionmaker(bind=engine)
