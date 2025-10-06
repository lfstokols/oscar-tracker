import datetime


def current_year() -> int:
    now = datetime.datetime.now()
    if now.month >= 11:
        # Starting in November, it's Oscar season, so the current ceremony is the upcoming one
        # that means the relvant movies are still coming out, so the current year is the actual year
        return now.year
    elif now.month <= 3:
        # Before March, it't still Oscar season and the current ceremony is upcoming
        # However, it's past New Years so that means last year
        return now.year - 1
    else:
        # Between March and November, we're looking to the most recent ceremony
        return now.year - 1
