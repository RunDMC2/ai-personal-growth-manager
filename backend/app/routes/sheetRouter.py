from fastapi import APIRouter, Depends, HTTPException
from app.controllers.sheetController import (
    pull_filtered_todo_list,
    pull_stats,
    pull_from_range,
    get_sheet_ids,
)

router = APIRouter(
    prefix="/sheets",
    tags=["sheets"],
)

router.get("/pull-todo-list")(pull_filtered_todo_list)  # will pull all tasks from To Do list sheet

router.get("/pull-stats")(pull_stats)  # will pull all hard-coded stats from "Stats" sheet
router.get("/pull-from-range/{range_name}")(pull_from_range)
router.get("/get-sheet-ids")(get_sheet_ids)  # will return a dictionary of sheet names to their corresponding IDs
