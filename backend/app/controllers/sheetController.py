from datetime import date, datetime

import requests
from os import getenv
from dotenv import load_dotenv

from googleapiclient.discovery import build
from app.google_auth import get_credentials
from app.scheduler.scheduler_log import log_last_ran_time

load_dotenv()


# ----- Pull from To Do list -----

async def pull_todo_list():
    """
    Pulls all tasks from To Do list and uploads to PostgreSQL database
    """

    log_last_ran_time("pull_todo_list")

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

    for row in rows:
        # pad row in case trailing empty cells were dropped
        row = row + [""] * (8 - len(row))
        do_flag, done_flag, task, assigned_by, due_by = row[0], row[1], row[2], row[3], row[4]

        if not due_by:
            continue
        due_date = datetime.strptime(due_by, "%m/%d/%Y").date()

        if due_date >= today:
            today_onward.append(row)
        elif done_flag != "TRUE" and due_date < today:
            overdue.append(row)

        if do_flag == "TRUE" and due_date >= today:
            do_tasks.append(row)

    return {
        "today_onward": today_onward,
        "overdue": overdue,
        "do_tasks": do_tasks,
    }


# ----- General pulling ranges -----

def pull_from_range(range_name: str):
    """
    Returns desired range of data from desired range in the form of:

    e.g. for "Dashboard!A1:E25"
    [
        [A1, B1, C1, D1, E1],
        [A2, B2, C2, D2, E2],
        ...
    ]
    """
    creds = get_credentials()
    spreadsheet_id = getenv("SIP_SHEET_ID")

    service = build("sheets", "v4", credentials=creds)

    result = (
        service.spreadsheets()
        .values()
        .get(spreadsheetId=spreadsheet_id, range=range_name)
        .execute()
    )
    rows = result.get("values", [])
    return rows

def pull_stats():
    # Placeholder implementation for pulling stats from Google Sheets
    # In a real implementation, you would use the Google Sheets API to fetch data
    return {"message": "Stats pulled successfully from Google Sheets."}


def get_sheet_ids():
    """
    Return a dictionary of sheet names to their corresponding IDs.
    (Mainly used on backend for logging purposes)
    """
    creds = get_credentials()
    service = build("sheets", "v4", credentials=creds)

    # Get the spreadsheet ID from the environment variable
    spreadsheet_id = getenv("SIP_SHEET_ID")

    # Fetch the spreadsheet metadata
    spreadsheet = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()

    # Extract sheet names and their corresponding IDs
    sheet_ids = {
        sheet["properties"]["title"]: sheet["properties"]["sheetId"]
        for sheet in spreadsheet.get("sheets", [])
    }

    return sheet_ids

