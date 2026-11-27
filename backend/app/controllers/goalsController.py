from googleapiclient.discovery import build
from app.google_auth import get_credentials

from app.controllers.sheetsController import pull_from_range
from app.scheduler.scheduler_log import log_last_ran_time
from db.db_cursor import db_cursor

from datetime import datetime, timedelta, date
from os import getenv
from dotenv import load_dotenv

load_dotenv()


def add_goals_to_db(weekStart: str = "None"):
    """
    Pulls goals from specific week from sheet, starting with Monday of said week.
    Then inserts them into the database, updating if they already exist.
    """

    goal_points = int(getenv("GOAL_POINTS", 10))

    log_last_ran_time("add_goals_to_db", job_desc="Pulls goals from specific week from sheet, then upserts them into the db", base_job="update_goals_list")

    if weekStart == "None":
        # If no weekStart, make date equal to most recent past Monday
        today = date.today()
        weekStart = (today - timedelta(days=today.weekday())).strftime("%Y-%m-%d")

    # Goal titles and ids
    goals = pull_from_range(f"Goals!B1:F2")

    # format goals from sheets into tuples for db insertion
    _goal_tuples = []
    goal_tuples = []
    for i in range(5):
        try:
            _goal_tuples.append((int(goals[0][i][-1]), goals[1][i]))
        except IndexError:
            _goal_tuples.append((int(goals[0][i][-1]), ""))  # If no goal title, insert empty string

        # Delete goal row if goal title is empty
        if _goal_tuples[i][1] == "":
            with db_cursor(commit=True) as cur:
                cur.execute("""
                    DELETE FROM goals
                    WHERE goal_id = %s
                """, (int(goals[0][i][-1]),))
        else:
            goal_tuples.append(_goal_tuples[i])

    with db_cursor(commit=True) as cur:
        cur.executemany("""
            INSERT INTO goals (goal_id, goal_name)
            VALUES (%s, %s)
            ON CONFLICT (goal_id)
            DO UPDATE SET
                goal_name = EXCLUDED.goal_name
        """, goal_tuples)

    # Row 5 is starter row, date there is 2026-08-14
    header_offset = 5
    index = datetime.strptime(weekStart, "%Y-%m-%d") - datetime(2026, 8, 14) + timedelta(days=header_offset)
    index = index.days

    # Pull goal completion data for the week
    completion_range = f"Goals!A{index}:F{index+6}"
    goal_completion = pull_from_range(completion_range)

    # format completion data into tuples for db insertion
    completion_tuples = []
    weekly_score = 0
    for weekday in range(7):
        day = datetime.strptime(weekStart, "%Y-%m-%d") + timedelta(days=weekday)
        i_tuple = (day.strftime("%Y-%m-%d"),)

        # add each element of goal_completion[i][1:] to i_tuple
        for i in range(1, 6):
            try:
                val = goal_completion[weekday][i]
                if val != "":
                    i_tuple += (True,)
                else:
                    i_tuple += (False,)
            except IndexError:
                i_tuple += (False,)

        # calculate daily score for the day (10 points per completed goal)
        daily_score = sum(goal_points for goal_completed in i_tuple[1:] if goal_completed)
        i_tuple += (daily_score,)
        weekly_score += daily_score

        completion_tuples.append(i_tuple)

    # add weekly score to each tuple
    completion_tuples = [tup + (weekly_score,) for tup in completion_tuples]

    # add tuples to db
    with db_cursor(commit=True) as cur:
        cur.executemany("""
            INSERT INTO goal_completions ("date", goal1, goal2, goal3, goal4, goal5, daily_score, weekly_score)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT ("date")
            DO UPDATE SET
                goal1 = EXCLUDED.goal1,
                goal2 = EXCLUDED.goal2,
                goal3 = EXCLUDED.goal3,
                goal4 = EXCLUDED.goal4,
                goal5 = EXCLUDED.goal5,
                daily_score = EXCLUDED.daily_score,
                weekly_score = EXCLUDED.weekly_score
        """, completion_tuples)

    return {"weekStart": weekStart, "goals": goals, "goal_completion": goal_completion}


def pull_week_goals(weekStart: str):
    """
    Pulls goals from a specific week from the database, starting with Monday.

    Returns:
        {
            "goals": [...],
            "score": {
                "weekly": int,
                "daily": [int, int, int, int, int, int, int]
            }
        }

    "goals": Should be formatted as:
        [
            "id": "goal(1-5)",
            "title": <Goal title>,
            "days": [false, false, true, false, true, false, false]  # 7 days of the week
        ]
    """

    week_start = datetime.strptime(weekStart, "%Y-%m-%d").date()
    week_dates = [
        week_start + timedelta(days=i)
        for i in range(7)
    ]

    # Pull completion records for the week
    with db_cursor() as cur:
        cur.execute("""
            SELECT * FROM goal_completions
            WHERE "date" >= %s AND "date" < %s
            ORDER BY "date" ASC
        """, (weekStart, (week_start + timedelta(days=7)).strftime("%Y-%m-%d")))
        rows = cur.fetchall()

    with db_cursor() as cur:
        cur.execute("""
            SELECT * FROM goals
        """)
        goals = cur.fetchall()

    # Map completion records to their respective dates.
    # This ensures missing dates don't shift the weekly day indexes.
    rows_by_date = {}

    daily_scores = []
    weekly_score = 0

    for row in rows:
        row_date = row["date"]

        if isinstance(row_date, datetime):
            row_date = row_date.date()

        if isinstance(row_date, date):
            row_date = row_date.isoformat()

        rows_by_date[str(row_date)] = row

        daily_scores.append(row["daily_score"])
        weekly_score = row["weekly_score"]  # All rows should have the same weekly score

    # Format goals into the structure expected by the frontend
    formatted_rows = []
    for goal in goals:
        if not goal.get("goal_name"):
            continue

        goal_id = goal["goal_id"]
        column = f"goal{goal_id}"

        days = [
            bool(rows_by_date.get(day.isoformat(), {}).get(column, False))
            for day in week_dates
        ]

        formatted_rows.append({
            "id": f"goal{goal_id}",
            "title": goal["goal_name"],
            "days": days
        })


    return {
        "goals": formatted_rows,
        "score": {
            "weekly": weekly_score,
            "daily": daily_scores
        }
    }
