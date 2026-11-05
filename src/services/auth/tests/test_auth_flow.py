"""End-to-end signup/login tests against a mocked DynamoDB (moto).

Run:  pip install -r requirements.txt -r requirements-dev.txt && pytest tests
"""
import os
import time

os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")
os.environ.setdefault("AWS_DEFAULT_REGION", "ap-south-1")
os.environ["DYNAMODB_ENDPOINT_URL"] = ""

import boto3  # noqa: E402
import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from moto import mock_aws  # noqa: E402

from app import dynamo  # noqa: E402
from app.main import app  # noqa: E402

USER = {
    "full_name": "Test User",
    "email": "Test.User@Gmail.com",
    "mobile": "+91 98765 43210",
    "password": "Passw0rd123",
    "city": "India",
}


@pytest.fixture()
def client():
    with mock_aws():
        dynamo.get_resource.cache_clear()
        dynamo.get_client.cache_clear()
        dynamo.db_status.update(ready=False, error="not checked")
        with TestClient(app) as c:
            for _ in range(50):
                if dynamo.db_status["ready"]:
                    break
                time.sleep(0.1)
            yield c


def test_signup_login_and_dynamodb_storage(client):
    r = client.post("/api/auth/signup", json=USER)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["user"]["mobile"] == "9876543210"
    assert body["user"]["email"] == "test.user@gmail.com"
    token = body["access_token"]

    # The user really is in the DynamoDB table (mobile = primary key).
    item = boto3.resource("dynamodb", region_name="ap-south-1").Table("devopsmate_users").get_item(
        Key={"mobile": "9876543210"}
    )["Item"]
    assert item["email"] == "test.user@gmail.com"
    assert item["full_name"] == "Test User"
    assert item["password_hash"] != USER["password"]  # stored hashed, never plain

    # Login with email (any case) and with mobile (+91 / spaces accepted).
    assert client.post("/api/auth/login", json={"email": "TEST.user@gmail.com", "password": USER["password"]}).status_code == 200
    assert client.post("/api/auth/login", json={"mobile": "9876543210", "password": USER["password"]}).status_code == 200
    assert client.post("/api/auth/login", json={"mobile": "+91 98765-43210", "password": USER["password"]}).status_code == 200

    # Token works for /me and profile update.
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200 and me.json()["full_name"] == "Test User"
    upd = client.patch("/api/auth/me", json={"city": "Bengaluru"}, headers={"Authorization": f"Bearer {token}"})
    assert upd.status_code == 200 and upd.json()["city"] == "Bengaluru"


def test_login_failures(client):
    client.post("/api/auth/signup", json=USER)
    assert client.post("/api/auth/login", json={"mobile": "9876543210", "password": "wrongpass1"}).status_code == 401
    assert client.post("/api/auth/login", json={"email": "nobody@gmail.com", "password": "Passw0rd123"}).status_code == 401
    assert client.post("/api/auth/login", json={"password": "Passw0rd123"}).status_code == 422


def test_signup_validation_and_duplicates(client):
    assert client.post("/api/auth/signup", json=USER).status_code == 201
    dup_email = {**USER, "mobile": "9123456780"}
    assert client.post("/api/auth/signup", json=dup_email).status_code == 409
    dup_mobile = {**USER, "email": "other@gmail.com"}
    assert client.post("/api/auth/signup", json=dup_mobile).status_code == 409
    assert client.post("/api/auth/signup", json={**USER, "email": "bad", "mobile": "9000000001"}).status_code == 422
    assert client.post("/api/auth/signup", json={**USER, "email": "a@gmail.com", "mobile": "123"}).status_code == 422
    assert client.post("/api/auth/signup", json={**USER, "email": "b@gmail.com", "mobile": "9000000002", "password": "short"}).status_code == 422


def test_signup_sends_welcome_mail(client, monkeypatch):
    sent = []

    async def fake_send(msg, **kwargs):
        sent.append(msg)

    monkeypatch.setattr("app.email_service.aiosmtplib.send", fake_send)
    assert client.post("/api/auth/signup", json=USER).status_code == 201
    assert len(sent) == 1
    msg = sent[0]
    assert msg["To"] == "test.user@gmail.com"
    assert msg["Subject"] == "Welcome to DevOpsMate"
    text = msg.get_payload()[0].get_payload(decode=True).decode()
    for expected in ("Dear Test User", "AWS + DevOps + AI", "Job Support", "Interview Support (30 days)",
                     "non-refundable", "/privacy", "/refund", "/terms", "+91 80889 29670"):
        assert expected in text


def test_health_ok_when_ready(client):
    health = client.get("/api/auth/health")
    assert health.status_code == 200
    assert health.json()["mail"] == "mailhog"
    assert client.get("/health").status_code == 200


def test_clear_503_when_dynamodb_is_down():
    """No credentials / unreachable DynamoDB must give a clear 503, not a crash or bare 500."""
    saved = {k: os.environ.pop(k) for k in ("AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY") if k in os.environ}
    os.environ["AWS_EC2_METADATA_DISABLED"] = "true"
    os.environ["AWS_SHARED_CREDENTIALS_FILE"] = "/nonexistent"
    os.environ["AWS_CONFIG_FILE"] = "/nonexistent"
    try:
        dynamo.get_resource.cache_clear()
        dynamo.get_client.cache_clear()
        dynamo.db_status.update(ready=False, error="not checked")
        with TestClient(app, raise_server_exceptions=False) as c:
            r = c.post("/api/auth/signup", json=USER)
            assert r.status_code == 503, r.text
            assert "database" in r.json()["detail"].lower()
            assert c.post("/api/auth/login", json={"mobile": "9876543210", "password": "Passw0rd123"}).status_code == 503
            assert c.get("/health").status_code == 200  # process stays up
            time.sleep(0.5)
            h = c.get("/api/auth/health")
            assert h.status_code == 503
            assert "credentials" in h.json()["detail"].lower()
    finally:
        os.environ.update(saved)
        for k in ("AWS_EC2_METADATA_DISABLED", "AWS_SHARED_CREDENTIALS_FILE", "AWS_CONFIG_FILE"):
            os.environ.pop(k, None)
        dynamo.get_resource.cache_clear()
        dynamo.get_client.cache_clear()
