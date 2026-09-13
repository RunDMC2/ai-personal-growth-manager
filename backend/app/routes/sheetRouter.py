from fastapi import APIRouter, Depends, HTTPException
from app.controllers.sheetController import (
    pull_stats,
    pull_from_range,
)

router = APIRouter(
    prefix="/sheets",
    tags=["sheets"],
)

router.get("/pull-stats")(pull_stats)  # will pull all hard-coded stats from "Stats" sheet
router.get("/pull-from-range/{range_name}")(pull_from_range)
