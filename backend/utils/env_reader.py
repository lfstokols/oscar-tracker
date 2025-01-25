import os
from pathlib import Path

from dotenv import load_dotenv


def check_env_var(var_name: str) -> str:
    var = os.getenv(var_name)
    if not var:
        raise ValueError(f"{var_name} must be set in .env file")
    return var


def get_int_env_var(var_name: str) -> int:
    var = int(check_env_var(var_name))
    return var


def get_bool_env_var(var_name: str) -> bool:
    var = check_env_var(var_name)
    return var.lower() == "true"


def get_str_env_var(var_name: str) -> str:
    var = check_env_var(var_name)
    return var


def get_path_env_var(var_name: str, project_root_directory: Path) -> Path:
    var = check_env_var(var_name)
    if var.startswith("/"):
        return Path(var)
    if var.startswith("./"):
        return project_root_directory / var[2:]
    raise ValueError(
        f"In .env file: {var_name} must begin with ./ (relative to project root) or / (absolute)"
    )


try:
    project_root_directory = Path(os.environ["ROOT_DIR"])
except Exception as e:
    raise ValueError(
        f"The ROOT_DIR was not set correctly before importing env_reader: {e}"
    )
try:
    load_dotenv(project_root_directory / ".env")
except Exception as e:
    raise ValueError(f"The .env file is missing or has an error: {e}")

try:
    RUN_DEBUG = get_bool_env_var("RUN_DEBUG")
    DEVSERVER_PORT = get_int_env_var("DEVSERVER_PORT")
    TMDB_API_KEY = get_str_env_var("TMDB_API_KEY")
    IMDB_API_KEY = get_str_env_var("IMDB_API_KEY")
    PYDANTIC_ERROR_STATUS_CODE = get_int_env_var("PYDANTIC_ERROR_STATUS_CODE")
    FLASK_SECRET_KEY = get_str_env_var("FLASK_SECRET_KEY")
    MAX_LOG_FILE_SIZE = get_int_env_var("MAX_LOG_FILE_SIZE")
    MAX_BACKUP_FILES = get_int_env_var("MAX_BACKUP_FILES")
    PRINT_DEBUG = get_bool_env_var("PRINT_DEBUG")
    DATABASE_PATH = get_path_env_var("DATABASE_PATH", project_root_directory)
    BACKUPS_PATH = get_path_env_var("BACKUPS_PATH", project_root_directory)
    STATIC_PATH = get_path_env_var("STATIC_PATH", project_root_directory)
    LOG_PATH = get_path_env_var("LOG_PATH", project_root_directory)
except Exception as e:
    raise ValueError(
        f"A variable from the .env file is missing or improperly formatted: {e}"
    )
