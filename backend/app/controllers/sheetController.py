import requests
from os import getenv
from dotenv import load_dotenv
import json

from googleapiclient.discovery import build
from app.google_auth import get_credentials

load_dotenv()

def pull_stats_test():
    creds = get_credentials()
    range_name = "Dashboard!D2:I25"
    spreadsheet_id = getenv("SIP_SHEET_ID")

    service = build("sheets", "v4", credentials=creds)

    result = (
        service.spreadsheets()
        .values()
        .get(spreadsheetId=spreadsheet_id, range=range_name)
        .execute()
    )
    rows = result.get("values", []).json()
    return rows

def pull_stats():
    # Placeholder implementation for pulling stats from Google Sheets
    # In a real implementation, you would use the Google Sheets API to fetch data
    return {"message": "Stats pulled successfully from Google Sheets."}
