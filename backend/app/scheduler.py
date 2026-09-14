import asyncio
from datetime import datetime, timedelta

from app.controllers.sheetController import pull_filtered_todo_list

async def update_todo_list():
    """
    This will be called upon user navigating to the Flight Log page, 
    and will run the update from To Do list function every 15 seconds,
    until the user navigates away from the page.
    """
    while True:
        # Call the function to update the To Do list
        await pull_filtered_todo_list()
        
        # Wait for 15 seconds before the next update
        await asyncio.sleep(15)