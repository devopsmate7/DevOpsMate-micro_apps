"""Simple site visitor counter stored in the users DynamoDB table."""
from __future__ import annotations

from datetime import datetime, timezone

from botocore.exceptions import ClientError

from app.dynamo import get_table

STATS_KEY = "__site_visitors__"


def bump_and_get_visitors() -> int:
    table = get_table()
    try:
        resp = table.update_item(
            Key={"mobile": STATS_KEY},
            UpdateExpression="ADD visit_count :one SET updated_at = :ts",
            ExpressionAttributeValues={
                ":one": 1,
                ":ts": datetime.now(timezone.utc).isoformat(),
            },
            ReturnValues="UPDATED_NEW",
        )
        return int(resp["Attributes"].get("visit_count", 1))
    except ClientError:
        raise


def get_visitors() -> int:
    table = get_table()
    resp = table.get_item(Key={"mobile": STATS_KEY})
    item = resp.get("Item") or {}
    return int(item.get("visit_count", 0))
