"""
Generates and refreshes token.json for Google Sheets API access.

First run: opens a browser window for you to log in and grant access,
then saves the resulting credentials to token.json.

Subsequent runs: loads token.json and silently refreshes it if the
access token has expired (as long as the refresh token is still valid).
"""
import os.path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

# Full read/write access. Use the commented line instead if you only
# ever need to read data, not write to sheets.
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
# SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]

# Anchor these to this file's own directory, not the process's cwd,
# so they resolve the same way regardless of where the backend is launched from.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CREDENTIALS_FILE = os.path.join(BASE_DIR, "credentials.json")
TOKEN_FILE = os.path.join(BASE_DIR, "token.json")


def get_credentials():
    """Return valid OAuth credentials, refreshing or regenerating as needed."""
    creds = None

    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                CREDENTIALS_FILE, SCOPES
            )
            creds = flow.run_local_server(port=0)

        # Save (or overwrite) the token for next time
        with open(TOKEN_FILE, "w") as token:
            token.write(creds.to_json())

    return creds


if __name__ == "__main__":
    # for initial setup, run this script to generate token.json
    get_credentials()
    print(f"Credentials ready. Token saved to {TOKEN_FILE}")
    