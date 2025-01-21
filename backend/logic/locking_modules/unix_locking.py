# type: ignore
import fcntl


def lock_file(file, wants_exclusive: bool):
    fcntl.flock(
        file.fileno(),
        fcntl.LOCK_EX if wants_exclusive else fcntl.LOCK_SH,
    )


def unlock_file(file):
    file.seek(0)
    fcntl.flock(file.fileno(), fcntl.LOCK_UN)
