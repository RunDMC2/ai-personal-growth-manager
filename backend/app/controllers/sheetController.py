import requests
from os import getenv

from googleapiclient.discovery import build
from app.google_auth import get_credentials


def pull_stats_test():
    creds = get_credentials()
    range_name = "Dashboard!D2:I25"
    spreadsheet_id = getenv("SIP_SHEET_ID")
    print(spreadsheet_id)  

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
