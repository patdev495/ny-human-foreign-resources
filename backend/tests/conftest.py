"""Keep domain tests focused on domain behavior while auth has its own tests."""

from __future__ import annotations

from collections.abc import Generator
from typing import Callable

import pytest
from fastapi import FastAPI


@pytest.fixture(autouse=True)
def authenticate_legacy_hr_tests(
    request: pytest.FixtureRequest, monkeypatch: pytest.MonkeyPatch,
) -> Generator[None, None, None]:
    if request.node.get_closest_marker("auth_real"):
        yield
        return

    import main
    from features.auth.security import require_user

    def test_user() -> object:
        return object()

    original_create_app: Callable[[], FastAPI] = main.create_app

    def create_authenticated_app() -> FastAPI:
        app = original_create_app()
        app.dependency_overrides[require_user] = test_user
        return app

    main.app.dependency_overrides[require_user] = test_user
    monkeypatch.setattr(main, "create_app", create_authenticated_app)
    yield
    main.app.dependency_overrides.pop(require_user, None)
