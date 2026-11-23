"""Zoom Server-to-Server OAuth: create one meeting per booking."""
from __future__ import annotations

import base64
import json
import os
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict

ZOOM_ACCOUNT_ID = os.getenv("ZOOM_ACCOUNT_ID", "").strip()
ZOOM_CLIENT_ID = os.getenv("ZOOM_CLIENT_ID", "").strip()
ZOOM_CLIENT_SECRET = os.getenv("ZOOM_CLIENT_SECRET", "").strip()
ZOOM_HOST_EMAIL = os.getenv("ZOOM_HOST_EMAIL", "devopsmate7@gmail.com").strip()


def _basic_auth() -> str:
    raw = f"{ZOOM_CLIENT_ID}:{ZOOM_CLIENT_SECRET}".encode()
    return base64.b64encode(raw).decode()


def zoom_access_token() -> str:
    if not (ZOOM_ACCOUNT_ID and ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET):
        raise RuntimeError("Zoom credentials missing (ZOOM_ACCOUNT_ID / CLIENT_ID / CLIENT_SECRET)")
    qs = urllib.parse.urlencode(
        {"grant_type": "account_credentials", "account_id": ZOOM_ACCOUNT_ID}
    )
    req = urllib.request.Request(
        f"https://zoom.us/oauth/token?{qs}",
        method="POST",
        headers={
            "Authorization": f"Basic {_basic_auth()}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        data=b"",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Zoom token failed: {e.read().decode()}") from e
    token = data.get("access_token")
    if not token:
        raise RuntimeError("Zoom token response missing access_token")
    return str(token)


def create_meeting(
    *,
    topic: str,
    start_iso: str,
    duration_min: int,
    timezone: str = "Asia/Kolkata",
) -> Dict[str, Any]:
    token = zoom_access_token()
    start = (start_iso or "").replace("Z", "").split("+")[0][:19]
    if len(start) == 16:
        start = f"{start}:00"

    body = {
        "topic": topic[:200],
        "type": 2,
        "start_time": start,
        "duration": int(duration_min),
        "timezone": timezone,
        "settings": {
            "join_before_host": True,
            "waiting_room": False,
            "mute_upon_entry": True,
        },
    }
    user = urllib.parse.quote(ZOOM_HOST_EMAIL or "me")
    req = urllib.request.Request(
        f"https://api.zoom.us/v2/users/{user}/meetings",
        method="POST",
        data=json.dumps(body).encode(),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Zoom create meeting failed: {e.read().decode()}") from e
