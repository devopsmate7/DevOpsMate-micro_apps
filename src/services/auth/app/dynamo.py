"""DynamoDB connection + table bootstrap for the users table.

Table design
------------
Table: settings.dynamodb_table_users (default "devopsmate_users")
  - Partition key (primary key): "mobile"   (String, 10-digit phone number)
  - Global Secondary Index "email-index":
      - Partition key (secondary key): "email"  (String, lowercased)

Mobile is the user's immutable identity (primary key). Email uniqueness and
email-based login are served through the GSI, since DynamoDB only supports
direct GetItem lookups on the base table's own key.
"""
from __future__ import annotations

import logging
import time
from functools import lru_cache

import boto3
from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError

from app.config import settings

logger = logging.getLogger(__name__)

EMAIL_INDEX = "email-index"


def _client_kwargs() -> dict:
    kwargs: dict = {"region_name": settings.aws_region}
    if settings.dynamodb_endpoint_url:
        kwargs["endpoint_url"] = settings.dynamodb_endpoint_url
    return kwargs


@lru_cache(maxsize=1)
def get_resource():
    return boto3.resource("dynamodb", **_client_kwargs())


@lru_cache(maxsize=1)
def get_client():
    return boto3.client("dynamodb", **_client_kwargs())


def get_table():
    return get_resource().Table(settings.dynamodb_table_users)


# Shared status so the API can explain *why* DynamoDB is not usable instead of
# crashing the container (which shows up to users as a bare 502 from nginx).
db_status: dict = {"ready": False, "error": "DynamoDB connection has not been checked yet"}


def explain_error(exc: Exception) -> str:
    if isinstance(exc, NoCredentialsError):
        return (
            "No AWS credentials found. Attach an IAM role with DynamoDB access to the EC2 "
            "instance and set the instance metadata hop limit to 2 (containers need it)."
        )
    return f"{type(exc).__name__}: {exc}"


def connect_with_retry() -> None:
    """Keep trying until the users table is ready. Runs in a background thread."""
    attempt = 0
    while True:
        try:
            ensure_table()
            db_status.update(ready=True, error=None)
            logger.info("DynamoDB ready (table=%s)", settings.dynamodb_table_users)
            return
        except (BotoCoreError, ClientError) as exc:
            attempt += 1
            db_status.update(ready=False, error=explain_error(exc))
            logger.warning("DynamoDB not ready (attempt %s): %s", attempt, db_status["error"])
            time.sleep(min(2 * attempt, 30))


def ensure_table() -> None:
    """Create the users table (+ email GSI) if it does not already exist.

    In production this table should normally be provisioned via IaC
    (Terraform/CloudFormation) ahead of time; this is a safe no-op once the
    table exists and is mainly here so local dev / DynamoDB Local "just works".
    """
    client = get_client()
    try:
        client.describe_table(TableName=settings.dynamodb_table_users)
        return
    except ClientError as exc:
        if exc.response.get("Error", {}).get("Code") != "ResourceNotFoundException":
            raise

    logger.info("Creating DynamoDB table %s", settings.dynamodb_table_users)
    client.create_table(
        TableName=settings.dynamodb_table_users,
        BillingMode="PAY_PER_REQUEST",
        AttributeDefinitions=[
            {"AttributeName": "mobile", "AttributeType": "S"},
            {"AttributeName": "email", "AttributeType": "S"},
        ],
        KeySchema=[
            {"AttributeName": "mobile", "KeyType": "HASH"},
        ],
        GlobalSecondaryIndexes=[
            {
                "IndexName": EMAIL_INDEX,
                "KeySchema": [{"AttributeName": "email", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            }
        ],
    )
    waiter = client.get_waiter("table_exists")
    waiter.wait(TableName=settings.dynamodb_table_users)
    logger.info("DynamoDB table %s ready", settings.dynamodb_table_users)
