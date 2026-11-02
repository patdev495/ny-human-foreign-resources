from __future__ import annotations

from fastapi.testclient import TestClient
import pytest


@pytest.mark.auth_real
def test_zalo_configuration_requires_login(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TESTING", "1")
    from main import create_app

    with TestClient(create_app()) as client:
        response = client.get("/api/zalo-reminder/status")
    assert response.status_code == 401


@pytest.mark.auth_real
def test_zalo_cutoff_and_daily_results_require_admin(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TESTING", "1")
    from main import create_app

    with TestClient(create_app()) as client:
        assert client.get("/api/zalo-reminder/cutoff").status_code == 401
        assert client.put("/api/zalo-reminder/cutoff", json={"time": "16:30"}).status_code == 401
        assert client.get("/api/zalo-reminder/daily?date=2026-11-02").status_code == 401
        assert client.post("/api/zalo-reminder/run-due").status_code == 401


@pytest.mark.auth_real
def test_admin_can_read_bot_connection_state(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TESTING", "1")
    from features.auth.models import User
    from features.auth.security import require_user
    from features.zalo_reminder.client import get_bot_client
    from main import create_app

    class FakeBot:
        def status(self) -> dict[str, bool]:
            return {"connected": True, "qr_available": False}

    app = create_app()
    app.dependency_overrides[require_user] = lambda: User(
        id=1, username="admin", display_name="Admin", password_hash="unused",
        is_admin=True, is_active=True,
    )
    app.dependency_overrides[get_bot_client] = lambda: FakeBot()
    with TestClient(app) as client:
        response = client.get("/api/zalo-reminder/status")
    assert response.json() == {"connected": True, "qr_available": False}


@pytest.mark.auth_real
def test_admin_sees_configuration_error_when_bot_secret_is_missing(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TESTING", "1")
    from core.config import settings
    from features.auth.models import User
    from features.auth.security import require_user
    from main import create_app

    monkeypatch.setattr(settings, "hr_zalo_bot_secret", "")
    app = create_app()
    app.dependency_overrides[require_user] = lambda: User(
        id=1, username="admin", display_name="Admin", password_hash="unused",
        is_admin=True, is_active=True,
    )
    with TestClient(app) as client:
        response = client.get("/api/zalo-reminder/status")
    assert response.status_code == 503
    assert "chưa được cấu hình" in response.json()["detail"]


@pytest.mark.auth_real
def test_non_admin_cannot_read_bot_configuration(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TESTING", "1")
    from features.auth.models import User
    from features.auth.security import require_user
    from main import create_app

    app = create_app()
    app.dependency_overrides[require_user] = lambda: User(
        id=2, username="hr", display_name="HR", password_hash="unused",
        is_admin=False, is_active=True,
    )
    with TestClient(app) as client:
        response = client.get("/api/zalo-reminder/status")
    assert response.status_code == 403


@pytest.mark.auth_real
def test_admin_can_scan_current_bot_qr(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TESTING", "1")
    from features.auth.models import User
    from features.auth.security import require_user
    from features.zalo_reminder.client import get_bot_client
    from main import create_app

    class FakeBot:
        def qr(self) -> bytes:
            return b"qr-image"

    app = create_app()
    app.dependency_overrides[require_user] = lambda: User(
        id=1, username="admin", display_name="Admin", password_hash="unused",
        is_admin=True, is_active=True,
    )
    app.dependency_overrides[get_bot_client] = lambda: FakeBot()
    with TestClient(app) as client:
        response = client.get("/api/zalo-reminder/qr")
    assert response.status_code == 200
    assert response.content == b"qr-image"


@pytest.mark.auth_real
def test_admin_can_find_bot_friends(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TESTING", "1")
    from features.auth.models import User
    from features.auth.security import require_user
    from features.zalo_reminder.client import get_bot_client
    from main import create_app

    class FakeBot:
        def friends(self) -> list[dict[str, str]]:
            return [{"id": "uid-1", "name": "HR Lan"}, {"id": "uid-2", "name": "HR Minh"}]

    app = create_app()
    app.dependency_overrides[require_user] = lambda: User(
        id=1, username="admin", display_name="Admin", password_hash="unused",
        is_admin=True, is_active=True,
    )
    app.dependency_overrides[get_bot_client] = lambda: FakeBot()
    with TestClient(app) as client:
        response = client.get("/api/zalo-reminder/friends?q=Minh")
    assert response.json() == [{"id": "uid-2", "name": "HR Minh"}]


@pytest.mark.auth_real
def test_admin_selection_is_retrievable_after_new_app_instance(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TESTING", "1")
    from features.auth.models import User
    from features.auth.security import require_user
    from features.zalo_reminder.client import get_bot_client
    from features.zalo_reminder.store import get_recipient_store
    from main import create_app

    class FakeBot:
        def friends(self) -> list[dict[str, str]]:
            return [{"id": "uid-1", "name": "HR Lan"}, {"id": "uid-2", "name": "HR Minh"}]

    class FakeStore:
        selected: list[dict[str, str]] = []

        def list_recipients(self) -> list[dict[str, str]]:
            return self.selected

        def replace_recipients(self, people: list[dict[str, str]]) -> None:
            self.selected = people

    store = FakeStore()

    def app_with_dependencies():
        app = create_app()
        app.dependency_overrides[require_user] = lambda: User(
            id=1, username="admin", display_name="Admin", password_hash="unused",
            is_admin=True, is_active=True,
        )
        app.dependency_overrides[get_bot_client] = lambda: FakeBot()
        app.dependency_overrides[get_recipient_store] = lambda: store
        return app

    with TestClient(app_with_dependencies()) as client:
        saved = client.put("/api/zalo-reminder/recipients", json={"ids": ["uid-2"]})
    with TestClient(app_with_dependencies()) as client:
        loaded = client.get("/api/zalo-reminder/recipients")
    assert saved.status_code == 200
    assert loaded.json() == [{"id": "uid-2", "name": "HR Minh"}]


@pytest.mark.auth_real
def test_admin_sends_test_reminder_to_one_selected_hr(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TESTING", "1")
    from features.auth.models import User
    from features.auth.security import require_user
    from features.zalo_reminder.client import get_bot_client
    from features.zalo_reminder.store import get_recipient_store
    from main import create_app

    sent: list[tuple[str, str]] = []

    class FakeBot:
        def send(self, id: str, message: str) -> None:
            sent.append((id, message))

    class FakeStore:
        deliveries: list[dict[str, str]] = []

        def list_recipients(self) -> list[dict[str, str]]:
            return [{"id": "uid-1", "name": "HR Lan"}]

        def record_delivery(self, id: str, name: str, status: str, error: str = "") -> None:
            self.deliveries.append({"id": id, "name": name, "status": status, "error": error, "trigger_type": "TEST"})

        def list_deliveries(self) -> list[dict[str, str]]:
            return self.deliveries

    store = FakeStore()
    app = create_app()
    app.dependency_overrides[require_user] = lambda: User(
        id=1, username="admin", display_name="Admin", password_hash="unused",
        is_admin=True, is_active=True,
    )
    app.dependency_overrides[get_bot_client] = lambda: FakeBot()
    app.dependency_overrides[get_recipient_store] = lambda: store
    with TestClient(app) as client:
        response = client.post("/api/zalo-reminder/test-send", json={"id": "uid-1"})
        unselected = client.post("/api/zalo-reminder/test-send", json={"id": "uid-2"})
        history = client.get("/api/zalo-reminder/deliveries")
    assert response.status_code == 200
    assert unselected.status_code == 404
    assert sent == [("uid-1", "Đã đến giờ chốt báo cơm cho ngày mai và sắp xếp xe tan làm hôm nay. Vui lòng truy cập https://ns.nienyi.vn để thực hiện.")]
    assert history.json() == [{"id": "uid-1", "name": "HR Lan", "status": "SENT", "error": "", "trigger_type": "TEST"}]


@pytest.mark.auth_real
def test_failed_test_send_is_visible_to_admin(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TESTING", "1")
    from features.auth.models import User
    from features.auth.security import require_user
    from features.zalo_reminder.client import BotUnavailable, get_bot_client
    from features.zalo_reminder.store import get_recipient_store
    from main import create_app

    class FailingBot:
        def send(self, id: str, message: str) -> None:
            raise BotUnavailable("Zalo bot is unavailable")

    class FakeStore:
        deliveries: list[dict[str, str]] = []

        def list_recipients(self) -> list[dict[str, str]]:
            return [{"id": "uid-1", "name": "HR Lan"}]

        def record_delivery(self, id: str, name: str, status: str, error: str = "") -> None:
            self.deliveries.append({"id": id, "name": name, "status": status, "error": error, "trigger_type": "TEST"})

        def list_deliveries(self) -> list[dict[str, str]]:
            return self.deliveries

    store = FakeStore()
    app = create_app()
    app.dependency_overrides[require_user] = lambda: User(
        id=1, username="admin", display_name="Admin", password_hash="unused",
        is_admin=True, is_active=True,
    )
    app.dependency_overrides[get_bot_client] = lambda: FailingBot()
    app.dependency_overrides[get_recipient_store] = lambda: store
    with TestClient(app) as client:
        response = client.post("/api/zalo-reminder/test-send", json={"id": "uid-1"})
        history = client.get("/api/zalo-reminder/deliveries")
    assert response.status_code == 503
    assert history.json()[0]["status"] == "FAILED"
