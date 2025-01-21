import msvcrt


def lock_file(file, wants_exclusive: bool):
    msvcrt.locking(
        file.fileno(),
        (msvcrt.LK_NBLCK if wants_exclusive else msvcrt.LK_NBRLCK),
        1,
    )


def unlock_file(file):
    file.seek(0)
    msvcrt.locking(file.fileno(), msvcrt.LK_UNLCK, 1)
