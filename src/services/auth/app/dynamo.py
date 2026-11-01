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
from functools import lru_cache

import boto3

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


def ensure_table() -> None:
    """Create the users table (+ email GSI) if it does not already exist.

    In production this table should normally be provisioned via IaC
    (Terraform/CloudFormation) ahead of time; this is a safe no-op once the
    table exists and is mainly here so local dev / DynamoDB Local "just works".
    """
    client = get_client()
    existing = client.list_tables().get("TableNames", [])
    if settings.dynamodb_table_users in existing:
        return

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
