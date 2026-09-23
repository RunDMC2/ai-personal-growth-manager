from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime
from fastapi import APIRouter, HTTPException

from app.controllers.sheetController import pull_todo_list
from db.db_cursor import db_cursor

scheduler = AsyncIOScheduler()
router = APIRouter(
    prefix="/scheduler",
    tags=["scheduler"],
)

""" 
Registry for all scheduled jobs,
in form of:

    "title": {
        "func": <function name to be called>,
        "id": <unique job id>,
        "seconds": <interval in seconds>,
    }

Add new jobs to the registry, and then call register_jobs() to add them to the scheduler.
"""
JOB_REGISTRY = {
    "flight_log": {
        "func": pull_todo_list,
        "id": "update_todo_list",
        "seconds": 15,
    }
}

# ----- Controllers -----
def register_jobs():
    for job in JOB_REGISTRY:
        scheduler.add_job(
            JOB_REGISTRY[job]["func"],
            "interval",
            seconds=JOB_REGISTRY[job]["seconds"],
            id=JOB_REGISTRY[job]["id"],
            next_run_time=None,  # not scheduled to run yet
            replace_existing=True,  # replace job if it already exists
        )

def start_job(job_id: str):
    """
    Start a job by its ID.
    """
    job = scheduler.get_job(job_id)
    if job:
        scheduler.modify_job(job_id, next_run_time=datetime.now()) # runs immediately
        log_last_ran_time(job_id)
    else:
        raise ValueError(f"No job found with ID: {job_id}")


def stop_job(job_id: str):
    """
    Stop a job by its ID.
    """
    job = scheduler.get_job(job_id)
    if job:
        scheduler.pause_job(job_id) # stops the job from running
    else:
        raise ValueError(f"No job found with ID: {job_id}")
    

# ----- Routes -----
@router.post("/register-jobs")
async def register_jobs_route():
    try:
        register_jobs()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"status": "registered", "jobs": list(JOB_REGISTRY.keys())}

@router.post("/start/{job_id}")
async def start_job_route(job_id: str):
    try:
        start_job(job_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"status": "started", "job_id": job_id}

@router.post("/stop/{job_id}")
async def stop_job_route(job_id: str):
    try:
        stop_job(job_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"status": "stopped", "job_id": job_id}


# ----- Upload last ran time to database -----
def log_last_ran_time(job_id: str):
    """
    Log the last ran time of a job to the database.
    """
    job = scheduler.get_job(job_id)
    if job:
        last_ran_time = job.next_run_time

        with db_cursor(commit=True) as cur:
            cur.execute("""
                INSERT INTO scheduler (job_id, last_ran)
                VALUES (job_id, datetime.now())
                ON CONFLICT (job_id)
                DO UPDATE SET
                    last_ran = EXCLUDED.last_ran
            """)
