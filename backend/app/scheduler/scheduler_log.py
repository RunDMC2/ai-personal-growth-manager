from datetime import datetime, timezone

from db.db_cursor import db_cursor



# ----- Upload last ran time to database -----
def log_last_ran_time(job_id: str, base_job: str = None):
    """
    Log the last ran time of a job to the database.
    """

    with db_cursor(commit=True) as cur:
        cur.execute("""
            INSERT INTO scheduler (job_id, last_ran, base_job)
            VALUES (%s, %s, %s)
            ON CONFLICT (job_id)
            DO UPDATE SET
                last_ran = EXCLUDED.last_ran
                base_job = EXCLUDED.base_job
        """, (job_id, datetime.now(tz=timezone.utc), base_job))
