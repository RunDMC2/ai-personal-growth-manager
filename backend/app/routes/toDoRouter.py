from fastapi import APIRouter, Depends, HTTPException
from app.controllers.toDoController import (
    pull_todo_list,
    get_tasks,
    schedule_task,
    get_task_counts,
)

router = APIRouter(
    prefix="/sheets/to-do",
    tags=["to-do"],
)

router.get("/pull-todo-list")(pull_todo_list)  # will pull all tasks from To Do list sheet

router.get("/tasks")(get_tasks)  # returns all tasks from the database for the Flight Log page
router.patch("/tasks/{row}/schedule")(schedule_task) # saves the day a task is planned for (custom mode)
router.get("/tasks/get-counts")(get_task_counts)  # returns counts of tasks for the Flight Log page
