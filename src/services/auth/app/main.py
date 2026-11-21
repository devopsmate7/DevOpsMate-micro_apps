import logging
import threading

from botocore.exceptions import BotoCoreError, ClientError
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import dynamo
from app.config import settings
from app.routers import auth

logging.basicConfig(level=logging.INFO)

app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)


@app.exception_handler(BotoCoreError)
@app.exception_handler(ClientError)
async def dynamodb_unavailable(request: Request, exc: Exception):
    # Any DynamoDB failure becomes a clear 503 JSON error (never a bare 500).
    logging.error("DynamoDB error on %s: %s", request.url.path, dynamo.explain_error(exc))
    return JSONResponse(
        status_code=503,
        content={"detail": "Our database is not reachable right now. Please try again in a minute."},
    )


def _ensure_admin_user() -> None:
    import time

    from botocore.exceptions import ClientError

    from app import user_repo
    from app.dynamo import get_table
    from app.security import hash_password

    while not dynamo.db_status.get("ready"):
        time.sleep(2)
    mobile = settings.admin_mobile
    password_hash = hash_password(settings.admin_password)
    try:
        existing = user_repo.get_by_mobile(mobile)
        if existing:
            get_table().update_item(
                Key={"mobile": mobile},
                UpdateExpression="SET password_hash = :p, is_active = :a, full_name = :n",
                ExpressionAttributeValues={
                    ":p": password_hash,
                    ":a": True,
                    ":n": "DevOpsMate Admin",
                },
            )
            logging.info("Admin user password refreshed for %s", mobile)
        else:
            user_repo.create_user(
                full_name="DevOpsMate Admin",
                email=settings.admin_email,
                mobile=mobile,
                city="India",
                password_hash=password_hash,
            )
            logging.info("Admin user created for %s", mobile)
    except (BotoCoreError, ClientError) as exc:
        logging.warning("Could not ensure admin user yet: %s", dynamo.explain_error(exc))


@app.on_event("startup")
def on_startup():
    # Do not crash if DynamoDB is unreachable: keep serving and keep retrying,
    # so /api/auth/health can report the exact reason.
    logging.info(
        "Mail via %s:%s as %s (tls=%s, password=%s)",
        settings.smtp_host,
        settings.smtp_port,
        settings.smtp_user or "(none)",
        settings.smtp_tls,
        "set" if settings.smtp_password else "MISSING",
    )
    threading.Thread(target=dynamo.connect_with_retry, daemon=True).start()
    threading.Thread(target=_ensure_admin_user, daemon=True).start()


@app.get("/health")
def root_health():
    return {"status": "ok", "service": settings.app_name}
