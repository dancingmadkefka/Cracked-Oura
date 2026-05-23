"""Integration tests for the /api/investigations CRUD endpoints."""

from __future__ import annotations

from typing import Iterator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from backend.src.api.investigations import router as investigations_router
from backend.src.database import get_db
from backend.src.models import Base


@pytest.fixture()
def client() -> Iterator[TestClient]:
    # StaticPool + check_same_thread=False so the FastAPI TestClient's worker
    # threads share the same in-memory SQLite database as the fixture.
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    app = FastAPI()
    app.include_router(investigations_router)

    def _override_get_db():
        session = TestingSession()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    engine.dispose()


def test_list_returns_empty_initially(client: TestClient):
    r = client.get("/api/investigations")
    assert r.status_code == 200
    assert r.json() == []


def test_create_then_list_then_get(client: TestClient):
    payload = {
        "name": "Bedtime vs readiness",
        "kind": "correlation",
        "payload": {
            "x_metric": "sleep_session.bedtime_start_minutes",
            "y_metric": "readiness.score",
            "lag_days": 1,
            "method": "pearson",
        },
    }
    r = client.post("/api/investigations", json=payload)
    assert r.status_code == 201, r.text
    body = r.json()
    inv_id = body["id"]
    assert body["name"] == payload["name"]
    assert body["kind"] == "correlation"
    assert body["payload"]["lag_days"] == 1

    rr = client.get("/api/investigations")
    assert len(rr.json()) == 1

    one = client.get(f"/api/investigations/{inv_id}")
    assert one.status_code == 200
    assert one.json()["id"] == inv_id


def test_patch_renames_and_updates_payload(client: TestClient):
    created = client.post(
        "/api/investigations",
        json={"name": "A", "kind": "correlation", "payload": {"x": 1}},
    ).json()
    inv_id = created["id"]

    r = client.patch(
        f"/api/investigations/{inv_id}",
        json={"name": "B", "payload": {"x": 2}},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["name"] == "B"
    assert body["payload"]["x"] == 2


def test_delete_removes_investigation(client: TestClient):
    created = client.post(
        "/api/investigations",
        json={"name": "doomed", "kind": "ai", "payload": {}},
    ).json()
    inv_id = created["id"]
    r = client.delete(f"/api/investigations/{inv_id}")
    assert r.status_code == 204
    r2 = client.get(f"/api/investigations/{inv_id}")
    assert r2.status_code == 404


def test_get_missing_returns_404(client: TestClient):
    r = client.get("/api/investigations/does-not-exist")
    assert r.status_code == 404
