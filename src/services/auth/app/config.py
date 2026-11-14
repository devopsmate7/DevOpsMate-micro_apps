from __future__ import annotations

from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "DevOpsMate"
    app_tagline: str = "Learn | Grow | Succeed"

    # DynamoDB-backed user store.
    # Primary key = mobile (partition key), secondary lookup = email (GSI "email-index").
    aws_region: str = "ap-south-1"
    dynamodb_table_users: str = "devopsmate_users"
    # Leave empty in real AWS/EKS (uses the default credential chain / IRSA).
    # Set to e.g. http://localhost:8000 to point at DynamoDB Local for local dev.
    dynamodb_endpoint_url: str = ""

    jwt_secret: str = "change-me-in-production-use-long-random-string"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    # Minimum pause after successful signup before the token is returned.
    signup_delay_seconds: int = 20

    smtp_host: str = "127.0.0.1"
    smtp_port: int = 1025
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "DevOpsMate <devopsmate7@gmail.com>"
    smtp_tls: bool = False

    cors_origins: str = "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()

