from fastapi import APIRouter, Depends, HTTPException
from ..controllers.sheetController import pull_stats

router = APIRouter(
    prefix="/sheets",
    tags=["sheets"],
)

router.get("/pull-stats")(pull_stats)
