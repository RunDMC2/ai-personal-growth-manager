

from app.controllers.sheetsController import pull_from_range
from app.scheduler.scheduler_log import log_last_ran_time
from db.db_cursor import db_cursor

from datetime import datetime, timedelta, date
from os import getenv
from dotenv import load_dotenv

load_dotenv()



def add_weaknesses_to_db(weekStart: str = "None"):
    """
    Pulls weaknesses from the DISC tab of spreadsheet and saves them to the database.
    """

    log_last_ran_time("add_weaknesses_to_db", job_desc="Pulls weaknesses from specific week from sheet, then upserts them into the db", base_job="update_weaknesses_list")

    if weekStart == "None":
        # If no weekStart, make date equal to most recent past Monday
        today = date.today()
        weekStart = (today - timedelta(days=today.weekday())).strftime("%Y-%m-%d")

    # weakness titles and ids
    weaknesses = pull_from_range(f"DISC!B1:G2")

    # format weaknesses from sheets into tuples for db insertion
    _weakness_tuples = []
    weakness_tuples = []
    for i in range(6):
        try:
            _weakness_tuples.append((int(weaknesses[0][i][-1]), weaknesses[1][i]))
        except IndexError:
            _weakness_tuples.append((int(weaknesses[0][i][-1]), ""))  # If no weakness title, insert empty string

        # Delete weakness row if weakness title is empty
        if _weakness_tuples[i][1] == "":
            with db_cursor(commit=True) as cur:
                cur.execute("""
                    DELETE FROM weaknesses
                    WHERE weakness_id = %s
                """, (int(weaknesses[0][i][-1]),))
        else:
            weakness_tuples.append(_weakness_tuples[i])

    with db_cursor(commit=True) as cur:
        cur.executemany("""
            INSERT INTO weaknesses (weakness_id, weakness_name)
            VALUES (%s, %s)
            ON CONFLICT (weakness_id)
            DO UPDATE SET
                weakness_name = EXCLUDED.weakness_name
        """, weakness_tuples)

    # Row 3 is starter row, date there is 2026-07-21
    header_offset = 3
    index = datetime.strptime(weekStart, "%Y-%m-%d") - datetime(2026, 7, 21) + timedelta(days=header_offset)
    index = index.days

    # Pull weakness completion data for the week
    completion_range = f"DISC!A{index}:G{index+6}"
    weakness_completion = pull_from_range(completion_range)

    # format completion data into tuples for db insertion
    completion_tuples = []
    for weekday in range(7):
        day = datetime.strptime(weekStart, "%Y-%m-%d") + timedelta(days=weekday)
        i_tuple = (day.strftime("%Y-%m-%d"),)

        # add each element of weakness_completion[i][1:] to i_tuple
        for i in range(1, 7):
            try:
                val = weakness_completion[weekday][i]
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
            INSERT INTO weakness_completions ("date", weakness1, weakness2, weakness3, weakness4, weakness5, weakness6)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT ("date")
            DO UPDATE SET
                weakness1 = EXCLUDED.weakness1,
                weakness2 = EXCLUDED.weakness2,
                weakness3 = EXCLUDED.weakness3,
                weakness4 = EXCLUDED.weakness4,
                weakness5 = EXCLUDED.weakness5,
                weakness6 = EXCLUDED.weakness6
        """, completion_tuples)

    return {"weekStart": weekStart, "weaknesses": weaknesses, "weakness_completion": weakness_completion}


def pull_week_weaknesses(weekStart: str):
    """
    Pulls weaknesses from specific week from database, starting with Monday of said week.
    """
    with db_cursor() as cur:
        cur.execute("""
            SELECT * FROM weakness_completions
            WHERE "date" >= %s AND "date" < %s
            ORDER BY "date" ASC
        """, (weekStart, (datetime.strptime(weekStart, "%Y-%m-%d") + timedelta(days=7)).strftime("%Y-%m-%d")))
        
        rows = cur.fetchall()

    with db_cursor() as cur:
        cur.execute("""
            SELECT * FROM weaknesses
        """)
        weaknesses = cur.fetchall()

    """ 
    Rows should formatted as:

    [
        "id": "weakness(1-6)",
        "title": <Weakness title>,
        "days": [false, false, true, false, true, false, false]  # 7 days of the week
    ]
    """

    formatted_rows = []
    for weakness in weaknesses:
        if weakness.get("weakness_name") is None or weakness.get("weakness_name") == "":
            continue
        formatted_rows.append({
            "id": f"weakness{weakness['weakness_id']}",
            "title": weakness["weakness_name"],
            "days": [row[f"weakness{weakness['weakness_id']}"] for row in rows]
        })
    return formatted_rows

