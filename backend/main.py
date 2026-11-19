
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles


# Support both local development and Vercel deployment
try:
    from backend.routers.auth import router as auth_router
    from backend.routers.listings import router as listings_router

except ModuleNotFoundError as error:
    if error.name != "backend":
        raise

    from routers.auth import router as auth_router
    from routers.listings import router as listings_router


app = FastAPI(
    title="WarmShare API",
    description="REST API documentation for WarmShare Donation Management MVP",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)


# Register API routers
app.include_router(auth_router)
app.include_router(listings_router)


# Health check
@app.get("/api/health")
def health():
    return {"status": "ok"}


# Hello API
@app.get("/api/hello")
def hello(name: str = "World"):
    return {"message": f"Hello, {name}!"}


# Serve built React frontend
FRONTEND_DIR = (
    Path(__file__).resolve().parent.parent
    / "frontend"
    / "dist"
)

if FRONTEND_DIR.is_dir():
    app.mount(
        "/",
        StaticFiles(
            directory=FRONTEND_DIR,
            html=True,
        ),
        name="frontend",
    )
