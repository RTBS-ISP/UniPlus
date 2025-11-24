import pytz
from datetime import datetime

DEFAULT_PROFILE_PIC = "/images/logo.png"


def convert_to_bangkok_time(dt: datetime | None):
    """
    Convert a datetime object to Bangkok timezone
    Returns a timezone-aware datetime in Asia/Bangkok
    """
    bangkok_tz = pytz.timezone("Asia/Bangkok")

    if dt is None:
        return None

    if dt.tzinfo is None:
        dt = pytz.UTC.localize(dt)

    return dt.astimezone(bangkok_tz)
