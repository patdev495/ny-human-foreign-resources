from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass


@dataclass(frozen=True)
class NotificationTarget:
    channel: str
    recipient_id: str
    name: str
    send: Callable[[str], None]
    rejected: tuple[type[Exception], ...] = ()
