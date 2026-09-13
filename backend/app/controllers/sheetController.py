import requests
from os import getenv
from dotenv import load_dotenv

from googleapiclient.discovery import build
from app.google_auth import get_credentials

load_dotenv()


# ----- Pull from To Do list -----

def pull_filtered_todo_list():
    """
    Returns filtered list of To Do tasks to be completed from
    today and onwards, in the form of:

    [
        ...
    ]
    """
    creds = get_credentials()
    spreadsheet_id = getenv("SIP_SHEET_ID")

    service = build("sheets", "v4", credentials=creds)

    range = {
        "sheetId": 2081456943,      # To Do list sheet ID
        "startRowIndex": 1,         # Skip header row
        "startColumnIndex": 0,
    }

    # request for all tasks from today and onward, sorted by Due By date (ascending),
    # including uncompleted and completed tasks
    todayOnwardTasks = {
        "addFilterView": {
            "filter": {
                "title": "Today Onward Tasks",
                "range": range,
                "sortSpecs": [
                    {
                        "dimensionIndex": 4,  # Sort by Due By column (Date)
                        "sortOrder": "ASCENDING",
                    }
                ],
                "criteria": {
                    4: {  # Due By column (Date)
                        "condition": {
                            "type": "DATE_AFTER",
                            "values": {"relativeDate": "TODAY"},
                        }
                    }
                },
            }
        }
    }

    body = {"requests": [todayOnwardTasks]}
    todayOnwardTasksResponse = (
        service.spreadsheets()
        .batchUpdate(spreadsheetId=spreadsheet_id, body=body)
        .execute()
    )

    # filters and returns only the tasks that are overdue
    overdueTasks = {
        "addFilterView": {
            "filter": {
                "title": "Overdue Tasks",
                "range": range,
                "sortSpecs": [
                    {
                        "dimensionIndex": 4,  # Sort by Due By column (Date)
                        "sortOrder": "ASCENDING",
                    }
                ],
                "criteria": {
                    4: {  # Due By column (Date)
                        "condition": {
                            "type": "DATE_BEFORE",
                            "values": {"relativeDate": "TODAY"},
                        }
                    }
                },
            }
        }
    }

    body = {"requests": [overdueTasks]}
    overdueTasksResponse = (
        service.spreadsheets()
        .batchUpdate(spreadsheetId=spreadsheet_id, body=body)
        .execute()
    )

    # filteres only for tasks marked as "Do" (TRUE) in the Do column
    doTasks = {
        "addFilterView": {
            "filter": {
                "title": "Do Tasks",
                "range": range,
                "sortSpecs": [
                    {
                        "dimensionIndex": 4,  # Sort by Due By column (Date)
                        "sortOrder": "ASCENDING",
                    }
                ],
                "criteria": {
                    0: {  # Do column
                        "condition": {
                            "type": "TEXT_EQ",
                            "values": [{"userEnteredValue": "TRUE"}],
                        }
                    }
                },
            }
        }
    }
    body = {"requests": [doTasks]}
    doTasksResponse = (
        service.spreadsheets()
        .batchUpdate(spreadsheetId=spreadsheet_id, body=body)
        .execute()
    )

    print("All tasks:\n", todayOnwardTasksResponse, "\n")
    print("Overdue tasks:\n", overdueTasksResponse, "\n")
    print("Do tasks:\n", doTasksResponse, "\n")


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

