import time
from flask import jsonify
import numpy as np
import pandas as pd


def no_year_response():
    return (jsonify({"error": "No year provided"}), 400)


# FYI: errno 13 is the error number for permission denied, which includes file locking issues
# Code 423 is the HTTP status code for "Locked". Srsly, that exists.
def catch_file_locked_error(func, *args, **kwargs):
    """
    Wraps a function to catch file locking errors and return a 423 status code.

        Args:
                func, *args, **kwargs

        Returns:
                jsonify(func(*args, **kwargs))
    """
    try:
        return jsonify(func(*args, **kwargs))
    except OSError as e:
        if e.errno == 13:
            print(
                f"Locked file [Errno 13]: {func.__name__}({args}, {kwargs}) failed at {time.time()}"
            )
            return {"error": "File is locked, please try again later", 'retryable': 'true'}, 423
        raise

def df_to_jsonable(storage, df: pd.DataFrame, flavor) -> list[dict]:
    if storage.flavor_props(flavor)["shape"] == "entity":
        df = df.reset_index()
    df = df.replace({np.nan: None})
    return df.to_dict(orient="records")