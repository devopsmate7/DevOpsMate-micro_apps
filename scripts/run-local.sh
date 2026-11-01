#!/usr/bin/env bash
# Runs every service directly on the host (no Docker) for quick UI work.
# Auth needs DynamoDB: start DynamoDB Local first, e.g.
#   docker compose up -d dynamodb-local
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/src"
export PYTHONPATH="$SRC/services/auth/.pydeps"
export JWT_SECRET="${JWT_SECRET:-local-dev-secret}"
export AWS_REGION="${AWS_REGION:-ap-south-1}"
export DYNAMODB_TABLE_USERS="${DYNAMODB_TABLE_USERS:-devopsmate_users}"
export DYNAMODB_ENDPOINT_URL="${DYNAMODB_ENDPOINT_URL:-http://127.0.0.1:8500}"
export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-local}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-local}"
export SMTP_HOST="${SMTP_HOST:-127.0.0.1}"
export SMTP_PORT="${SMTP_PORT:-1025}"
export SMTP_TLS=false
export CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"

echo "Starting auth :8000, catalog :8001, commerce :8002, notice :8003, frontend :3000"

cd "$SRC/services/auth"
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 &
cd "$SRC/services/catalog"
python3 -m uvicorn main:app --host 127.0.0.1 --port 8001 &
cd "$SRC/services/commerce"
python3 -m uvicorn main:app --host 127.0.0.1 --port 8002 &
cd "$SRC/services/notice"
python3 -m uvicorn main:app --host 127.0.0.1 --port 8003 &
cd "$SRC/frontend"
npx vite --host 127.0.0.1 --port 3000 &
wait
