import logging
import time

from botocore.exceptions import BotoCoreError, ClientError
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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


@app.on_event("startup")
def on_startup():
    for attempt in range(30):
        try:
            dynamo.ensure_table()
            logging.info("DynamoDB ready (table=%s)", settings.dynamodb_table_users)
            return
        except (BotoCoreError, ClientError):
            logging.warning("DynamoDB not ready, retry %s/30", attempt + 1)
            time.sleep(2)
    raise RuntimeError("Could not connect to DynamoDB")


@app.get("/health")
def root_health():
    return {"status": "ok", "service": settings.app_name}