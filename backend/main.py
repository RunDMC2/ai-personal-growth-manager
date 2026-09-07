from fastapi import FastAPI
import uvicorn

# from .routes import auth, goals, users


app = FastAPI(
	title="Ascent",
	version="1.0.0",
)

# app.include_router(auth.router)
# app.include_router(goals.router)
# app.include_router(users.router)


@app.get("/", tags=["health"])
async def health_check() -> dict[str, str]:
	return {"status": "ok"}


if __name__ == "__main__":
	uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
