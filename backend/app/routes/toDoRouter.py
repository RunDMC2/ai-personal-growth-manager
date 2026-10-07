from fastapi import APIRouter, Depends, HTTPException
from app.controllers.toDoController import (
    pull_todo_list,
    pull_stats,
    pull_from_range,
    get_sheet_ids,
    get_tasks,
    schedule_task,

)

router = APIRouter(
    prefix="/sheets",
    tags=["sheets"],
)

router.get("/pull-todo-list")(pull_todo_list)  # will pull all tasks from To Do list sheet

router.get("/tasks")(get_tasks)  # returns all tasks from the database for the Flight Log page
router.patch("/tasks/{row}/schedule")(schedule_task) # saves the day a task is planned for (custom mode)

router.get("/pull-stats")(pull_stats)  # will pull all hard-coded stats from "Stats" sheet
router.get("/pull-from-range/{range_name}")(pull_from_range)
router.get("/get-sheet-ids")(get_sheet_ids)  # will return a dictionary of sheet names to their corresponding IDs
