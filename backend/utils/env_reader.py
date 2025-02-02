import logging
import os
from pathlib import Path

from dotenv import load_dotenv


def check_env_var(var_name: str, optional: bool=False, default: str='') -> str:
    var = os.getenv(var_name)
    if not var:
        if optional:
            return default
        else:
            logging.warning(f"In .env file: didn't find value for {var_name}")
            raise ValueError(f"{var_name} must be set in .env file")
    return var


def get_int_env_var(var_name: str, optional: bool=False, default: int=0) -> int:
    var = int(check_env_var(var_name, optional, str(default)))
    return var


def get_bool_env_var(var_name: str, optional: bool=False, default: bool=False) -> bool:
    var = check_env_var(var_name, optional, str(default))
    return var.lower() == "true"


def get_str_env_var(var_name: str, optional: bool=False, default: str='') -> str:
    var = check_env_var(var_name, optional, default)
    return var


def get_path_env_var(var_name: str, project_root_directory: Path, default_path: Path|None=None) -> Path:
    optional = default_path is not None
    var = check_env_var(var_name, optional, '')
    if var.startswith("/"):
        return Path(var)
    if var.startswith("./"):
        return project_root_directory / var[2:]
    if optional and var == '':
        return default_path
    logging.warning(
        f"In .env file: {var_name} doesn't begin with ./ (relative to project root) or / (absolute)"
    )
    raise ValueError(
        f"In .env file: {var_name} must begin with ./ (relative to project root) or / (absolute)"
    )


try:
    project_root_directory = Path(os.environ["ROOT_DIR"])
except Exception as e:
    logging.warning(f"The ROOT_DIR was not set correctly before importing env_reader:\n {e}")
    raise ValueError(
        f"The ROOT_DIR was not set correctly before importing env_reader: {e}"
    )
try:
    load_dotenv(project_root_directory / ".env")
except Exception as e:
    logging.warning(f"The .env file is missing or has an error:\n {e}")
    raise ValueError(f"The .env file is missing or has an error: {e}")

try:
    RUN_DEBUG = get_bool_env_var("RUN_DEBUG", optional=True, default=True)
    DEVSERVER_PORT = get_int_env_var("DEVSERVER_PORT", optional=True, default=5000)
    TMDB_API_KEY = get_str_env_var("TMDB_API_KEY", optional=True, default='')
    IMDB_API_KEY = get_str_env_var("IMDB_API_KEY", optional=True, default='')
    PYDANTIC_ERROR_STATUS_CODE = get_int_env_var("PYDANTIC_ERROR_STATUS_CODE", optional=True, default=500)
    FLASK_SECRET_KEY = get_str_env_var("FLASK_SECRET_KEY", optional=True, default='67427564674275646742756467427564')
    MAX_LOG_FILE_SIZE = get_int_env_var("MAX_LOG_FILE_SIZE", optional=True, default=5)
    MAX_BACKUP_FILES = get_int_env_var("MAX_BACKUP_FILES", optional=True, default=5)
    PRINT_DEBUG = get_bool_env_var("PRINT_DEBUG", optional=True, default=True)
    DATABASE_PATH = get_path_env_var("DATABASE_PATH", project_root_directory, default_path=project_root_directory / "var" / "database")
    BACKUPS_PATH = get_path_env_var("BACKUPS_PATH", project_root_directory, default_path=project_root_directory / "var" / "backups")
    STATIC_PATH = get_path_env_var("STATIC_PATH", project_root_directory, default_path=project_root_directory / "dist")
    LOG_PATH = get_path_env_var("LOG_PATH", project_root_directory, default_path=project_root_directory / "var" / "logs")
    SQLITE_FILE_NAME = get_str_env_var("SQLITE_FILE_NAME", optional=True, default="db.sqlite")
    LOG_ENDPOINT = get_str_env_var("LOG_ENDPOINT", optional=True, default="http://example.com")
except Exception as e:
    raise ValueError(
        f"A variable from the .env file is missing or improperly formatted: {e}"
    )
