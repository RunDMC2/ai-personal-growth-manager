from fastapi import APIRouter, Depends
from app.controllers.weaknessesController import (
    pull_week_weaknesses,
)

router = APIRouter(
    prefix="/weaknesses",
    tags=["weaknesses"],
)


router.get("/pull/{weekStart}")(pull_week_weaknesses)  # pulls all weaknesses for the given week from the sheet and saves to db
