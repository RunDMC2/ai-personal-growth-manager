from fastapi import APIRouter
from app.controllers.goalsController import (
    add_goals_to_db,
    pull_week_goals,
)

router = APIRouter(
    prefix="/goals",
    tags=["goals"],
)

router.get("/pull-goal-sheet")(add_goals_to_db)  

router.get("/pull/{weekStart}")(pull_week_goals)


