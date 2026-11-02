from __future__ import annotations

import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from core.config import settings


class BotUnavailable(Exception):
    """The local Zalo bot cannot answer a request."""


class BotClient:
    def status(self) -> dict[str, bool]:
        if not settings.hr_zalo_bot_secret:
            raise BotUnavailable("Bot Zalo chưa được cấu hình trên máy chủ")
        request = Request(
            f"http://127.0.0.1:{settings.hr_zalo_bot_port}/status",
            headers={"x-bot-secret": settings.hr_zalo_bot_secret},
        )
        try:
            with urlopen(request, timeout=5) as response:
                value: object = json.load(response)
        except (HTTPError, URLError, OSError, ValueError) as exc:
            raise BotUnavailable("Zalo bot is unavailable") from exc
        if not isinstance(value, dict):
            raise BotUnavailable("Invalid Zalo bot response")
        return {
            "connected": value.get("connected") is True,
            "qr_available": value.get("qr_available") is True,
        }

    def qr(self) -> bytes | None:
        if not settings.hr_zalo_bot_secret:
            raise BotUnavailable("Bot Zalo chưa được cấu hình trên máy chủ")
        request = Request(
            f"http://127.0.0.1:{settings.hr_zalo_bot_port}/qr",
            headers={"x-bot-secret": settings.hr_zalo_bot_secret},
        )
        try:
            with urlopen(request, timeout=5) as response:
                return response.read()
        except HTTPError as exc:
            if exc.code == 404:
                return None
            raise BotUnavailable("Zalo bot is unavailable") from exc
        except (URLError, OSError) as exc:
            raise BotUnavailable("Zalo bot is unavailable") from exc

    def friends(self) -> list[dict[str, str]]:
        if not settings.hr_zalo_bot_secret:
            raise BotUnavailable("Zalo bot is not configured")
        request = Request(
            f"http://127.0.0.1:{settings.hr_zalo_bot_port}/friends",
            headers={"x-bot-secret": settings.hr_zalo_bot_secret},
        )
        try:
            with urlopen(request, timeout=10) as response:
                value: object = json.load(response)
        except (HTTPError, URLError, OSError, ValueError) as exc:
            raise BotUnavailable("Zalo bot is unavailable") from exc
        if not isinstance(value, list):
            raise BotUnavailable("Invalid Zalo friends response")
        friends: list[dict[str, str]] = []
        for item in value:
            if isinstance(item, dict) and isinstance(item.get("id"), str) and isinstance(item.get("name"), str):
                friends.append({"id": item["id"], "name": item["name"]})
        return friends

    def send(self, id: str, message: str) -> None:
        if not settings.hr_zalo_bot_secret:
            raise BotUnavailable("Zalo bot is not configured")
        request = Request(
            f"http://127.0.0.1:{settings.hr_zalo_bot_port}/send",
            data=json.dumps({"id": id, "message": message}).encode("utf-8"),
            headers={"x-bot-secret": settings.hr_zalo_bot_secret, "content-type": "application/json"},
            method="POST",
        )
        try:
            with urlopen(request, timeout=15) as response:
                if response.status != 200:
                    raise BotUnavailable("Zalo bot did not confirm send")
        except (HTTPError, URLError, OSError) as exc:
            raise BotUnavailable("Zalo bot send failed") from exc


def get_bot_client() -> BotClient:
    return BotClient()
