from fastapi import APIRouter, Depends, HTTPException
from app.controllers.sheetController import (
    pull_stats,
    pull_stats_test
)

router = APIRouter(
    prefix="/sheets",
    tags=["sheets"],
)

router.get("/pull-stats")(pull_stats)
router.get("/pull-stats-test")(pull_stats_test) # just a test of the pulling from Google Sheets API
