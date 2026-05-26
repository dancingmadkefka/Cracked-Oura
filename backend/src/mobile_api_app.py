"""
Read-only FastAPI app for the Android client.

Serves cached Oura data from the shared SQLite database on a LAN-facing port.
Does not run Playwright, Oura login, export scheduling, or the desktop UI.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.src.api.analysis import router as analysis_router
from backend.src.api.investigations import router as investigations_router
from backend.src.api.mobile import mobile_client_router
from backend.src.database import init_db
from backend.src.paths import get_user_data_dir

logger = logging.getLogger("MobileAPI")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    logger.info(
        "Mobile read-only API ready (shared DB at %s). Oura sync is desktop-only.",
        get_user_data_dir() / "oura_database.db",
    )
    yield


def create_mobile_api_app() -> FastAPI:
    app = FastAPI(
        title="Cracked Oura Mobile API",
        description=(
            "Token-protected read API for the Android app. "
            "Data comes from the desktop app's local database; this process never contacts Oura."
        ),
        version="1.0.0",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(mobile_client_router)
    app.include_router(analysis_router)
    app.include_router(investigations_router)
    return app


app = create_mobile_api_app()
