from __future__ import annotations

import json
import logging
from typing import Optional

from backend.app.core.config import settings

logger = logging.getLogger(__name__)


class FCMProvider:
    """Firebase Admin adapter; raw tokens never enter logs or API responses."""

    def __init__(self) -> None:
        self._app = None
        self._messaging = None
        self.error: Optional[str] = None
        self._initialize()

    def _initialize(self) -> None:
        if settings.DEMO_MODE:
            self.error = "Firebase delivery is simulated in demo mode"
            return
        try:
            import firebase_admin
            from firebase_admin import credentials, messaging

            if settings.FIREBASE_CREDENTIALS_JSON:
                credential = credentials.Certificate(json.loads(settings.FIREBASE_CREDENTIALS_JSON))
            elif settings.FIREBASE_CREDENTIALS_FILE:
                credential = credentials.Certificate(settings.FIREBASE_CREDENTIALS_FILE)
            else:
                self.error = "Firebase Admin credentials are not configured"
                return

            self._app = firebase_admin.initialize_app(credential)
            self._messaging = messaging
        except Exception as exc:
            self.error = f"Firebase provider unavailable: {type(exc).__name__}"
            logger.warning("Firebase provider unavailable: %s", self.error)

    @property
    def available(self) -> bool:
        return self._app is not None and self._messaging is not None

    def send(self, token: str, title: str, body: str, data: dict[str, str]) -> str:
        if not self.available:
            raise RuntimeError(self.error or "Firebase provider unavailable")
        message = self._messaging.Message(
            notification=self._messaging.Notification(title=title, body=body),
            data=data,
            token=token,
        )
        return self._messaging.send(message, app=self._app)