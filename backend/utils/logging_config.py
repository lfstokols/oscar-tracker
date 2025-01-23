import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
import sys
from datetime import datetime


def setup_logging(log_dir: Path):
    # Create logs directory if it doesn't exist
    log_dir.mkdir(parents=True, exist_ok=True)

    # Add timestamp to log files to prevent overwriting
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # Configure root logger
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            # Rotating file handler for all logs (10MB per file, max 5 backup files)
            RotatingFileHandler(
                log_dir / f"app_{timestamp}.log",
                maxBytes=10_000_000,  # 10MB
                backupCount=5,
            ),
            # Rotating file handler for errors only
            (
                fh := RotatingFileHandler(
                    log_dir / f"error_{timestamp}.log",
                    maxBytes=10_000_000,  # 10MB
                    backupCount=5,
                )
            ).setLevel(logging.ERROR)
            or fh,
            # Console handler
            logging.StreamHandler(sys.stdout),
        ],
    )

    # Create rotating handlers for stdout and stderr
    stdout_handler = RotatingFileHandler(
        log_dir / f"stdout_{timestamp}.log",
        maxBytes=10_000_000,  # 10MB
        backupCount=5,
        mode="a",
    )
    stderr_handler = RotatingFileHandler(
        log_dir / f"stderr_{timestamp}.log",
        maxBytes=10_000_000,  # 10MB
        backupCount=5,
        mode="a",
    )

    # Redirect stdout and stderr to rotating files
    sys.stdout = stdout_handler.stream
    sys.stderr = stderr_handler.stream
