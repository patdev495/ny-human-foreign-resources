from __future__ import annotations

from fastapi.testclient import TestClient
import pytest
from pydantic import ValidationError

from features.auth.schemas import PasswordChange, PasswordReset, UserCreate
from features.auth.security import hash_password, verify_password


@pytest.mark.auth_real
def test_password_is_salted_and_verifies() -> None:
    first = hash_password("mật khẩu đủ dài 123")
    second = hash_password("mật khẩu đủ dài 123")
    assert first != second
    assert verify_password("mật khẩu đủ dài 123", first)
    assert not verify_password("wrong password", first)


@pytest.mark.auth_real
def test_single_character_password_is_allowed() -> None:
    assert UserCreate(username="newuser", display_name="New User", password="x").password == "x"
    assert PasswordReset(password="x").password == "x"
    assert PasswordChange(current_password="old", new_password="x").new_password == "x"
    with pytest.raises(ValidationError):
        UserCreate(username="newuser", display_name="New User", password="")


@pytest.mark.auth_real
def test_hr_api_requires_login(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TESTING", "1")
    from main import create_app

    with TestClient(create_app()) as client:
        assert client.get("/api/hr-foreign/employees").status_code == 401
        assert client.get("/api/vehicle-management/providers").status_code == 401
        assert client.get("/api/auth/users").status_code == 401
        assert client.get("/api/auth/me").status_code == 401
        assert client.post(
            "/api/auth/login", json={"username": "admin", "password": "wrong"},
            headers={"Origin": "https://untrusted.example"},
        ).status_code == 403
