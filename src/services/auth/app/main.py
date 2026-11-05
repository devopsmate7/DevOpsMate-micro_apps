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


@app.on_event("startup")
def on_startup():
    # Do not crash if DynamoDB is unreachable: keep serving and keep retrying,
    # so /api/auth/health can report the exact reason.
    threading.Thread(target=dynamo.connect_with_retry, daemon=True).start()


@app.get("/health")
def root_health():
    return {"status": "ok", "service": settings.app_name}
