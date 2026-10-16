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
    for weekday in range(6):
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
        completion_tuples.append(i_tuple)

    # add tuples to db
    with db_cursor(commit=True) as cur:
        cur.executemany("""
            INSERT INTO goal_completions ("date", goal1, goal2, goal3, goal4, goal5)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT ("date")
            DO UPDATE SET
                goal1 = EXCLUDED.goal1,
                goal2 = EXCLUDED.goal2,
                goal3 = EXCLUDED.goal3,
                goal4 = EXCLUDED.goal4,
                goal5 = EXCLUDED.goal5
        """, completion_tuples)

    return {"weekStart": weekStart, "goals": goals, "goal_completion": goal_completion}


def pull_week_goals(weekStart: str):
    """
    Pulls goals from specific week from database, starting with Monday of said week.
    """

    with db_cursor() as cur:
        cur.execute("""
            SELECT * FROM goal_completions
            WHERE "date" >= %s AND "date" < %s
            ORDER BY "date" ASC
        """, (weekStart, (datetime.strptime(weekStart, "%Y-%m-%d") + timedelta(days=7)).strftime("%Y-%m-%d")))
        
        rows = cur.fetchall()

    with db_cursor() as cur:
        cur.execute("""
            SELECT * FROM goals
        """)
        goals = cur.fetchall()

    """ 
    Rows should formatted as:

    [
        "id": "goal(1-5)",
        "title": <Goal title>,
        "days": [false, false, true, false, true, false, false]  # 7 days of the week
    ]
    """

    formatted_rows = []
    for goal in goals:
        if goal.get("goal_name") is None or goal.get("goal_name") == "":
            continue
        formatted_rows.append({
            "id": f"goal{goal['goal_id']}",
            "title": goal["goal_name"],
            "days": [row[f"goal{goal['goal_id']}"] for row in rows]
        })
    return formatted_rows
