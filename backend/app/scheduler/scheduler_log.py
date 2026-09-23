from datetime import datetime, timezone

from db.db_cursor import db_cursor



# ----- Upload last ran time to database -----
def log_last_ran_time(job_id: str):
    """
    Log the last ran time of a job to the database.
    """

    with db_cursor(commit=True) as cur:
        cur.execute("""
            INSERT INTO scheduler (job_id, last_ran)
            VALUES (%s, %s)
            ON CONFLICT (job_id)
            DO UPDATE SET
                last_ran = EXCLUDED.last_ran
        """, (job_id, datetime.now(tz=timezone.utc)))
