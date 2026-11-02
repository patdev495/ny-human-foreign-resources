from __future__ import annotations

import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import Depends


class TelegramUnavailable(Exception):
    pass


class TelegramRejected(TelegramUnavailable):
    pass


class TelegramClient:
    def _call(self, token: str, method: str, payload: dict[str, str] | None = None) -> dict[str, object]:
        request = Request(
            f"https://api.telegram.org/bot{token}/{method}",
            data=urlencode(payload).encode("utf-8") if payload is not None else None,
            method="POST" if payload is not None else "GET",
        )
        try:
            with urlopen(request, timeout=12) as response:
                body: object = json.load(response)
        except HTTPError as exc:
            if exc.code in {400, 401, 403, 404, 429} and method == "sendMessage":
                raise TelegramRejected("Telegram từ chối tin nhắn") from None
            raise TelegramUnavailable("Không xác thực hoặc kết nối được bot Telegram") from None
        except (URLError, OSError, ValueError):
            raise TelegramUnavailable("Không xác thực hoặc kết nối được bot Telegram") from None
        if not isinstance(body, dict) or body.get("ok") is not True:
            raise TelegramUnavailable("Không xác thực hoặc kết nối được bot Telegram")
        result = body.get("result")
        return result if isinstance(result, dict) else {}

    def verify(self, token: str) -> dict[str, str]:
        result = self._call(token, "getMe")
        if not isinstance(result.get("id"), int) or not isinstance(result.get("username"), str):
            raise TelegramUnavailable("Phản hồi bot Telegram không hợp lệ")
        return {"id": str(result["id"]), "name": str(result.get("first_name") or result["username"]),
                "username": result["username"]}

    def set_webhook(self, token: str, url: str, secret: str) -> None:
        self._call(token, "setWebhook", {"url": url, "secret_token": secret})

    def send(self, token: str, chat_id: str, message: str) -> None:
        self._call(token, "sendMessage", {"chat_id": chat_id, "text": message})


def get_telegram_client() -> TelegramClient:
    return TelegramClient()
