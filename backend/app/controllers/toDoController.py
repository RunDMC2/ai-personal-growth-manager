from datetime import date, datetime, timezone
from fastapi import HTTPException
from pydantic import BaseModel

from os import getenv
from dotenv import load_dotenv

from googleapiclient.discovery import build
from app.google_auth import get_credentials
from app.scheduler.scheduler_log import log_last_ran_time
from db.db_cursor import db_cursor

load_dotenv()

 
# ----- Sheet value helpers -----
 
def _to_bool(v) -> bool:
    """Sheets returns 'TRUE'/'FALSE' strings (or nothing for empty cells)."""
    return str(v).strip().upper() == "TRUE"
 
 
def _or_none(v):
    """Empty sheet cells come back as '', which Postgres rejects for non-text columns."""
    v = str(v).strip()
    return v if v else None


# ----- Pull from To Do list -----

async def pull_todo_list():
    """
    Pulls all tasks from To Do list and uploads to PostgreSQL database
    """

    log_last_ran_time("pull_todo_list", base_job="update_todo_list")

    creds = get_credentials()
    spreadsheet_id = getenv("SIP_SHEET_ID")
    service = build("sheets", "v4", credentials=creds)

    result = (
        service.spreadsheets()
        .values()
        .get(spreadsheetId=spreadsheet_id, range="'To Do'!A2:H")
        .execute()
    )
    rows = result.get("values", [])

    today = date.today()
    today_onward, overdue, do_tasks = [], [], []
    db_rows = []
    updated_at = datetime.now(tz=timezone.utc)


    for sheet_row, row in enumerate(rows, start=2):
        # pad row in case trailing empty cells were dropped
        row = row + [""] * (8 - len(row))
        do_flag, done_flag, task, assigned_by, due_by, est_time_rem, days_rem, completed_on = row[:8]
        if not due_by:  # TODO: May need to fix later in the case of writing a task then deleting it 
            continue
        due_date = datetime.strptime(due_by, "%m/%d/%Y").date()

        if due_date >= today:
            today_onward.append(row)
        elif done_flag != "TRUE" and due_date < today:
            overdue.append(row)

        if do_flag == "TRUE" and due_date >= today:
            do_tasks.append(row)

        db_rows.append((
            sheet_row,
            _to_bool(do_flag),
            _to_bool(done_flag),
            task,
            assigned_by,
            due_date,  # a real date, not the 'MM/DD/YYYY' string
            _or_none(est_time_rem),
            _or_none(days_rem),
            _or_none(completed_on),
            updated_at,
        ))

    with db_cursor(commit=True) as cur:
        cur.executemany("""
            INSERT INTO to_do_tasks (row, "do", done, task, assigned_by, due_by, est_time_rem, days_rem, completed_on, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (row)
            DO UPDATE SET
                "do" = EXCLUDED."do",
                done = EXCLUDED.done,
                task = EXCLUDED.task,
                assigned_by = EXCLUDED.assigned_by,
                due_by = EXCLUDED.due_by,
                est_time_rem = EXCLUDED.est_time_rem,
                days_rem = EXCLUDED.days_rem,
                completed_on = EXCLUDED.completed_on,
                updated_at = EXCLUDED.updated_at
        """, db_rows)

    update_task_counts()  # update counts of done tasks for each day, and amount of tasks to do for current day; uploads to database

    return {
        "today_onward": today_onward,
        "overdue": overdue,
        "do_tasks": do_tasks,
    }


# ----- Tasks for the frontend -----
 
def _to_iso(v) -> str:
    """input may be a DATE column or the raw 'MM/DD/YYYY' sheet string."""
    if v is None:
        return None
    if isinstance(v, datetime):
        return v.date().isoformat()
    if isinstance(v, date):
        return v.isoformat()
    return datetime.strptime(v, "%m/%d/%Y").date().isoformat()
 
 
def get_tasks():
    """
    Returns every task in the database as a flat list for the frontend
    [{row, do, done, task, assigned_by, due_by}, ...]
    """
    with db_cursor() as cur:
        cur.execute("""
            SELECT *
            FROM to_do_tasks
            WHERE due_by IS NOT NULL AND due_by::text <> ''
        """)
        rows = cur.fetchall()
 
    return [
        {
            "id": r["row"],
            "do": bool(r["do"]),
            "done": bool(r["done"]),
            "name": r["task"],
            "assigned_by": r["assigned_by"],  # no category column exists, so assigned_by stands in
            "due_by": _to_iso(r["due_by"]),
            "est_time_rem": r["est_time_rem"],
            "days_rem": r["days_rem"],
            "completed_on": _to_iso(r["completed_on"]),
            "scheduledFor": r["scheduled_for"].isoformat() if r["scheduled_for"] else None,
        }
        for r in rows
    ]


class ScheduleBody(BaseModel):
    scheduled_for: date | None = None
 
def schedule_task(row: int, body: ScheduleBody):
    """
    Saves the day a task is planned for (custom mode). Send null to unschedule.
    """
    with db_cursor(commit=True) as cur:
        cur.execute(
            "UPDATE to_do_tasks SET scheduled_for = %s WHERE row = %s",
            (body.scheduled_for, row),
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail=f"No task in row {row}")
    return {"row": row, "scheduled_for": body.scheduled_for}


def update_task_counts():
    """
    Updates count of done tasks for each day, and amount of tasks to do for current day; uploads to database.
    """

    # Update done tasks counts for each day
    with db_cursor(commit=True) as cur:
        cur.execute("""
            INSERT INTO done_tasks_counts (date, count)
            SELECT 
                DATE(completed_on) AS date,
                COUNT(*) AS count
            FROM to_do_tasks
            WHERE done = true
            GROUP BY DATE(completed_on)
            ON CONFLICT (date) DO UPDATE
            SET count = EXCLUDED.count;
        """)

    with db_cursor(commit=True) as cur:
        # Update counts for "Do" tasks, Overdue tasks, and all to do tasks
        cur.execute("""
            WITH task_counts AS (
                SELECT 'All undone tasks' AS task_type, COUNT(*) AS count
                FROM to_do_tasks
                WHERE done = false
                
                UNION ALL
                
                SELECT 'Tasks marked Do', COUNT(*)
                FROM to_do_tasks
                WHERE "do" = true AND done = false
                
                UNION ALL
                
                SELECT 'Tasks marked Overdue', COUNT(*)
                FROM to_do_tasks
                WHERE days_rem LIKE '%Overdue%'

                UNION ALL

                SELECT 'All completed tasks', COUNT(*)
                FROM to_do_tasks
                WHERE done = true
            )
            UPDATE current_tasks_counts
            SET count = task_counts.count
            FROM task_counts
            WHERE current_tasks_counts.task_type = task_counts.task_type;
        """)

    return {"message": "Task counts updated successfully."}


def get_task_counts():
    """
    Returns the current counts of done tasks for each day, and amount of tasks to do for current day.
    """
    with db_cursor() as cur:
        cur.execute("""
            SELECT *
            FROM current_tasks_counts
        """)
        rows = cur.fetchall()

    with db_cursor() as cur:
        cur.execute("""
            SELECT count
            FROM done_tasks_counts
            WHERE "date" = %s;
        """, (date.today(),))
        rows.append({"task_type": "Tasks done today"} | cur.fetchone())  # Append today's done tasks count to the list

    return [
        {
            "task_type": r["task_type"],
            "count": r["count"],
        }
        for r in rows
    ]
 
