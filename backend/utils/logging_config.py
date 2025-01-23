import logging
from logging.handlers import RotatingFileHandler
import os, sys
from pathlib import Path
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from dotenv import load_dotenv

project_root_directory = Path(__file__).parent.parent
load_dotenv(project_root_directory / ".env")
max_log_file_size = int(os.getenv("MAX_LOG_FILE_SIZE") or "10_000_000")
max_backup_files = int(os.getenv("MAX_BACKUP_FILES") or "5")
print_debug = (os.getenv("PRINT_DEBUG") or "").lower() == "true"


def setup_file_handler(log_dir: Path, filename: str):
    file_handler = RotatingFileHandler(
        log_dir / filename,
        maxBytes=max_log_file_size,
        backupCount=max_backup_files,
    )
    return file_handler


def setup_logging(log_dir: Path):
    # * Create /logs/ directory if it doesn't exist
    log_dir.mkdir(parents=True, exist_ok=True)

    # * Add timestamp to log files to prevent overwriting
    timestamp = datetime.now().strftime("%Y_%m_%d__%H_%M_%S")

    # * Clear existing handlers
    root = logging.getLogger()
    root.handlers = []

    # Convert to EST timezone
    def est_time(*args):
        utc_dt = datetime.fromtimestamp(args[0], timezone.utc)
        est_dt = utc_dt.astimezone(ZoneInfo("America/New_York"))
        return est_dt.timetuple()

    logging.Formatter.converter = est_time

    file_formatter = logging.Formatter(
        "(%(asctime)s) [%(name)s] |%(levelname)s|>> %(message)s",
        datefmt="%m/%d/%Y @ %H:%M (%Z), %S sec",
    )
    console_formatter = ColorFormatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    # Create handlers
    file_handler_main = setup_file_handler(log_dir, "app.log")
    file_handler_main.setFormatter(file_formatter)
    file_handler_main.setLevel(logging.INFO)

    file_handler_error = setup_file_handler(log_dir, "error.log")
    file_handler_error.setFormatter(file_formatter)
    file_handler_error.setLevel(logging.ERROR)

    file_handler_debug = setup_file_handler(log_dir, "debug.log")
    file_handler_debug.setFormatter(file_formatter)
    file_handler_debug.setLevel(logging.DEBUG)
    file_handler_debug.addFilter(DebugLevelFilter())

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(console_formatter)
    console_handler.setLevel(logging.DEBUG if print_debug else logging.INFO)

    # Configure root logger
    logging.basicConfig(
        level=logging.DEBUG,
        handlers=[
            file_handler_main,
            file_handler_error,
            file_handler_debug,
            console_handler,
        ],
    )


# ANSI escape codes for colors
class ColorFormatter(logging.Formatter):
    """Custom formatter that adds colors to levelname in terminal output"""

    COLORS = {
        "DEBUG": "\033[36m",  # Cyan
        "INFO": "\033[32m",  # Green
        "WARNING": "\033[33m",  # Yellow
        "ERROR": "\033[31m",  # Red
        "CRITICAL": "\033[41m",  # Red background
        "RESET": "\033[0m",  # Reset color
    }

    def format(self, record):
        # Only add colors if the output is going to a terminal
        if sys.stdout.isatty():
            # Add colors to levelname
            record.levelname = (
                f"{self.COLORS.get(record.levelname, '')}"
                f"{record.levelname}"
                f"{self.COLORS['RESET']}"
            )

        return super().format(record)


class DebugLevelFilter(logging.Filter):
    def filter(self, record):
        return record.levelno == logging.DEBUG
