#!/usr/bin/env python3

import shutil
import sys
import signal
from pathlib import Path
import pandas as pd
from IPython.core.interactiveshell import InteractiveShell
import argparse

# Add the project root to Python path to enable imports
project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))

# Import backend modules
from backend.logic.storage_manager import StorageManager
import backend.logic.Processing as pr
import backend.logic.Mutations as mu
import backend.routing_lib.utils as utils
import backend.types.flavors as flv
from backend.types.my_types import *


def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="Oscar Database Playground")
    parser.add_argument(
        "-t", "--test", action="store_true", help="Use test database directory"
    )
    parser.add_argument(
        "-c", "--copy", action="store_true", help="Copy database to test directory"
    )
    parser.add_argument(
        "-y", "--year", type=int, help="Year to use for database operations"
    )
    parser.add_argument(
        "--vars", action="store_true", help="Pre-defined data variables for testing"
    )
    return parser.parse_args()


def init_environment(test_mode=False, copy_mode=False):
    """Initialize the storage object with standard paths"""
    database_dir = project_root / "backend" / "database"
    if test_mode:
        test_database_dir = project_root / "backend" / "test_database"
        test_database_dir.mkdir(exist_ok=True)
        if copy_mode:
            shutil.copytree(database_dir, test_database_dir)
        database_dir = test_database_dir
    storage = StorageManager(database_dir)
    return storage


def print_help():
    """Print available objects and basic usage information"""
    help_text = """
Available Objects:
-----------------
storage      : StorageManager instance for database operations
pr           : Processing functions module
mu           : Mutation functions module (be careful if not in test mode!)
utils        : Utility functions module
flv          : Flavors module for data type handling

With --vars flag
-----------------
movies      : storage.read('movies', year)
users       : storage.read('users')
categories  : storage.read('categories', year)
nominations : storage.read('nominations', year)
watchlist   : storage.read('watchlist', year)

Common Operations:
-----------------
storage.read(flavor, year=None)          : Read data from storage
storage.json_read(flavor, year=None)      : Read data in dict format
pr.get_movie(movie_id)                    : Get movie details
pr.get_nominations(year)                   : Get nominations for a year

Example Usage:
-------------
>>> noms_2023 = storage.read('nominations', 2023)
>>> movies = storage.read('movies', 2023)
>>> users = storage.read('users')
    """
    print(help_text)


def signal_handler(sig, frame):
    """Handle SIGINT by exiting gracefully"""
    print("\nReceived SIGINT. Exiting...")
    sys.exit(0)


def main():
    """Main REPL environment setup"""
    # Set up signal handler for SIGINT
    signal.signal(signal.SIGINT, signal_handler)

    args = parse_args()

    year = args.year or 2023

    # Initialize objects
    storage = init_environment(test_mode=args.test, copy_mode=args.copy)

    # Create a dict of objects to expose in the interactive shell
    namespace = {
        "storage": storage,
        "pr": pr,
        "mu": mu,
        "utils": utils,
        "flv": flv,
        "pd": pd,
        "Path": Path,
        "help_oscars": print_help,
        "TEST_MODE": args.test,
        "COPY_MODE": args.copy,
    }
    if args.vars:
        namespace["year"] = year
        namespace["movies"] = storage.read("movies", year)
        namespace["users"] = storage.read("users")
        namespace["categories"] = storage.read("categories", year)
        namespace["nominations"] = storage.read("nominations", year)
        namespace["watchlist"] = storage.read("watchlist", year)

    # Configure IPython shell
    shell = InteractiveShell.instance()
    shell.colors = "Linux"  # Colorful output

    print("Oscar Database Playground")
    print("------------------------")
    if args.test:
        print("Running in TEST MODE - using test database")
        if args.copy:
            print("Copying database to test directory")
    print("Type help_oscars() for available objects and common operations")

    # Start interactive shell with our namespace
    import code

    code.interact(local=namespace)


if __name__ == "__main__":
    main()
