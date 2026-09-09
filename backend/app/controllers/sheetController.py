import requests
from os import getenv
from dotenv import load_dotenv

from googleapiclient.discovery import build
from app.google_auth import get_credentials

load_dotenv()

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
