from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
import uvicorn

from app.routes.sheetRouter import router as sheet_router
from app.scheduler import scheduler, register_jobs, router as scheduler_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    register_jobs()
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(
	title="Ascent",
	version="1.0.0",
	lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sheet_router)
app.include_router(scheduler_router)


@app.get("/", tags=["health"])
async def health_check() -> dict[str, str]:
	return {"status": "ok"}

if __name__ == "__main__":
	uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
