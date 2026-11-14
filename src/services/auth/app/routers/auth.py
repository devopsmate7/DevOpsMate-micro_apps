from __future__ import annotations

import logging
import time
from typing import Optional

from botocore.exceptions import ClientError
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app import dynamo, user_repo
from app.config import settings
from app.email_service import send_welcome_email
from app.schemas import (
    LoginRequest,
    MessageResponse,
    ProfileUpdateRequest,
    SignupRequest,
    TokenResponse,
    UserOut,
)
from app.security import create_access_token, decode_access_token, hash_password, verify_password

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])
bearer = HTTPBearer(auto_error=False)


def _to_user_out(item: dict) -> UserOut:
    return UserOut(
        id=item["mobile"],
        full_name=item["full_name"],
        email=item["email"],
        mobile=item["mobile"],
        city=item["city"],
        created_at=item["created_at"],
    )


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, background_tasks: BackgroundTasks):
    if user_repo.get_by_email(payload.email):
        raise HTTPException(status_code=409, detail="This email is already registered. Please login.")
    if user_repo.get_by_mobile(payload.mobile):
        raise HTTPException(status_code=409, detail="This mobile number is already registered. Please login.")

    try:
        item = user_repo.create_user(
            full_name=payload.full_name,
            email=payload.email,
            mobile=payload.mobile,
            city=payload.city,
            password_hash=hash_password(payload.password),
        )
    except ClientError as e:
        if e.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException":
            raise HTTPException(status_code=409, detail="This mobile number is already registered. Please login.")
        logger.exception("DynamoDB signup failed for %s", payload.mobile)
        raise HTTPException(status_code=503, detail="Could not create account right now. Please try again.")

    background_tasks.add_task(
        _send_welcome_safe,
        item["full_name"],
        item["email"],
        item["mobile"],
        item["city"],
    )

    delay = max(0, int(settings.signup_delay_seconds or 0))
    if delay:
        time.sleep(delay)

    token = create_access_token(item["mobile"])
    return TokenResponse(access_token=token, user=_to_user_out(item))


def _send_welcome_safe(name: str, email: str, mobile: str, city: str) -> None:
    import asyncio

    try:
        asyncio.run(send_welcome_email(name, email, mobile, city))
    except Exception:
        logger.exception("Welcome email failed for %s (account still created)", email)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    if payload.mobile:
        item = user_repo.get_by_mobile(payload.mobile)
    else:
        item = user_repo.get_by_email(payload.email)

    if not item or not verify_password(payload.password, item["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid mobile/email or password")
    if not item.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is disabled")

    token = create_access_token(item["mobile"])
    return TokenResponse(access_token=token, user=_to_user_out(item))


def _current_user(credentials: Optional[HTTPAuthorizationCredentials]) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    mobile = decode_access_token(credentials.credentials)
    if not mobile:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    item = user_repo.get_by_mobile(mobile)
    if not item:
        raise HTTPException(status_code=401, detail="User not found")
    return item


@router.get("/me", response_model=UserOut)
def me(credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer)):
    item = _current_user(credentials)
    return _to_user_out(item)


@router.patch("/me", response_model=UserOut)
def update_me(
    payload: ProfileUpdateRequest,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
):
    item = _current_user(credentials)

    fields = {}
    if payload.full_name is not None:
        fields["full_name"] = payload.full_name
    if payload.city is not None:
        fields["city"] = payload.city

    if fields:
        try:
            item = user_repo.update_user(item["mobile"], **fields)
        except ClientError:
            logger.exception("DynamoDB profile update failed for %s", item["mobile"])
            raise HTTPException(status_code=503, detail="Could not update profile right now. Please try again.")

    return _to_user_out(item)


@router.get("/health", response_model=MessageResponse)
def health():
    if not dynamo.db_status["ready"]:
        raise HTTPException(status_code=503, detail=dynamo.db_status["error"] or "DynamoDB is not ready")
    if settings.smtp_password and settings.smtp_host == "smtp.gmail.com":
        mail = "gmail"
    elif settings.smtp_host in ("mailhog", "127.0.0.1", "localhost"):
        mail = "mailhog"
    else:
        mail = "not-configured"
    return MessageResponse(message="ok", mail=mail)
