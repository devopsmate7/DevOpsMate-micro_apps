"""DynamoDB-backed user repository.

mobile = primary key (partition key) -> each item is uniquely addressed by it.
email  = secondary key, looked up via the "email-index" GSI.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from boto3.dynamodb.conditions import Key

from app.dynamo import EMAIL_INDEX, get_table


def get_by_mobile(mobile: str) -> Optional[Dict[str, Any]]:
    resp = get_table().get_item(Key={"mobile": mobile})
    return resp.get("Item")


def get_by_email(email: str) -> Optional[Dict[str, Any]]:
    resp = get_table().query(
        IndexName=EMAIL_INDEX,
        KeyConditionExpression=Key("email").eq(email),
        Limit=1,
    )
    items = resp.get("Items") or []
    return items[0] if items else None


def create_user(*, full_name: str, email: str, mobile: str, city: str, password_hash: str) -> Dict[str, Any]:
    item = {
        "mobile": mobile,
        "email": email,
        "full_name": full_name,
        "city": city,
        "password_hash": password_hash,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    # Guards against a race where two signups land on the same mobile at once.
    get_table().put_item(Item=item, ConditionExpression="attribute_not_exists(mobile)")
    return item


def update_user(mobile: str, **fields: Any) -> Dict[str, Any]:
    """Update mutable attributes only (full_name, city). mobile/email are immutable."""
    if not fields:
        item = get_by_mobile(mobile)
        if not item:
            raise LookupError("User not found")
        return item

    expr_names = {}
    expr_values = {}
    set_clauses = []
    for key, value in fields.items():
        expr_names[f"#{key}"] = key
        expr_values[f":{key}"] = value
        set_clauses.append(f"#{key} = :{key}")

    resp = get_table().update_item(
        Key={"mobile": mobile},
        UpdateExpression="SET " + ", ".join(set_clauses),
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_values,
        ConditionExpression="attribute_exists(mobile)",
        ReturnValues="ALL_NEW",
    )
    return resp["Attributes"]
