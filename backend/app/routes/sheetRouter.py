from fastapi import APIRouter, Depends, HTTPException
from app.controllers.sheetController import pull_stats

router = APIRouter(
    prefix="/sheets",
    tags=["sheets"],
)

router.get("/pull-stats")(pull_stats)
