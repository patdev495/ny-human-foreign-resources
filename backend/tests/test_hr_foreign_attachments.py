from __future__ import annotations

import io
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from core.database import Base, get_db


@pytest.fixture
def client(tmp_path, monkeypatch):
    # Override database to isolated in-memory SQLite
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    # Override upload directory to tmp_path
    upload_dir = tmp_path / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)
    monkeypatch.setattr("features.hr_foreign.service.UPLOAD_DIR", str(upload_dir))

    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_attachment_lifecycle(client: TestClient) -> None:
    # 1. Upload attachment for PASSPORT (entity_id=1)
    fake_file_content = b"PDF-1.4 Fake document content"
    files = {
        "file": ("passport_scan.pdf", io.BytesIO(fake_file_content), "application/pdf")
    }
    data = {
        "entity_type": "PASSPORT",
        "entity_id": "1",
    }

    upload_res = client.post("/api/hr-foreign/attachments", data=data, files=files)
    assert upload_res.status_code == 201, upload_res.json()
    att = upload_res.json()
    assert att["file_name"] == "passport_scan.pdf"
    assert att["entity_type"] == "PASSPORT"
    assert att["entity_id"] == 1
    assert att["mime_type"] == "application/pdf"
    att_id = att["id"]

    # 2. List attachments for PASSPORT entity_id=1
    list_res = client.get("/api/hr-foreign/attachments?entity_type=PASSPORT&entity_id=1")
    assert list_res.status_code == 200
    att_list = list_res.json()
    assert len(att_list) == 1
    assert att_list[0]["id"] == att_id

    # List attachments for entity with no files
    empty_list_res = client.get("/api/hr-foreign/attachments?entity_type=VISA&entity_id=1")
    assert empty_list_res.status_code == 200
    assert len(empty_list_res.json()) == 0

    # 3. Preview attachment
    preview_res = client.get(f"/api/hr-foreign/attachments/{att_id}/preview")
    assert preview_res.status_code == 200
    assert preview_res.content == fake_file_content
    assert "inline" in preview_res.headers.get("content-disposition", "")

    # 4. Download attachment
    download_res = client.get(f"/api/hr-foreign/attachments/{att_id}/download")
    assert download_res.status_code == 200
    assert download_res.content == fake_file_content
    assert "attachment" in download_res.headers.get("content-disposition", "")

    # 5. Delete attachment
    del_res = client.delete(f"/api/hr-foreign/attachments/{att_id}")
    assert del_res.status_code == 204

    # Verify deleted in list
    list_after_del = client.get("/api/hr-foreign/attachments?entity_type=PASSPORT&entity_id=1")
    assert len(list_after_del.json()) == 0


def test_upload_exceeds_size_limit(client: TestClient) -> None:
    # 20 MB + 1 byte
    large_content = b"0" * (20 * 1024 * 1024 + 1)
    files = {
        "file": ("large_doc.pdf", io.BytesIO(large_content), "application/pdf")
    }
    data = {
        "entity_type": "VISA",
        "entity_id": "10",
    }

    res = client.post("/api/hr-foreign/attachments", data=data, files=files)
    assert res.status_code == 400
    assert "20" in res.json()["detail"] or "kích thước" in res.json()["detail"].lower() or "size" in res.json()["detail"].lower()
