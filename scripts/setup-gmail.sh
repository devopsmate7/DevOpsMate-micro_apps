#!/usr/bin/env bash
# On the EC2 host, from the cloned repo, as the ubuntu user:
#   bash scripts/setup-gmail.sh
#
# Asks for the Gmail app password of devopsmate7@gmail.com (input hidden), saves it
# in .env (git-ignored, readable only by you), restarts auth, and sends a test
# welcome mail to devopsmate7@gmail.com. Create the app password at
# https://myaccount.google.com/apppasswords (2-Step Verification must be on).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
GMAIL="devopsmate7@gmail.com"
COMPOSE=(sudo docker compose -f docker-compose.yml -f docker-compose.https.yml)

read -rsp "Gmail app password for ${GMAIL} (16 letters, input hidden): " PASS
echo
PASS="${PASS// /}"
if [ "${#PASS}" -ne 16 ]; then
  echo "A Gmail app password has 16 letters. Nothing was changed."
  exit 1
fi

touch .env
set_var() {
  grep -v "^$1=" .env > .env.tmp || true
  printf '%s=%s\n' "$1" "$2" >> .env.tmp
  mv .env.tmp .env
}
set_var SMTP_HOST smtp.gmail.com
set_var SMTP_PORT 587
set_var SMTP_USER "$GMAIL"
set_var SMTP_PASSWORD "$PASS"
set_var SMTP_FROM "\"DevOpsMate <${GMAIL}>\""
set_var SMTP_TLS true
if ! grep -q '^JWT_SECRET=' .env; then
  # A real login-token secret instead of the laptop default. Users sign in again once.
  set_var JWT_SECRET "$(openssl rand -hex 32)"
fi
chmod 600 .env
echo "Saved mail settings in ${ROOT}/.env"

echo "== Restarting auth and commerce =="
"${COMPOSE[@]}" up -d --build auth commerce
sleep 8

echo "== Sending a test welcome mail to ${GMAIL} =="
"${COMPOSE[@]}" exec -T auth python - <<'PY'
import asyncio
from app.config import settings
from app.email_service import send_welcome_email

asyncio.run(send_welcome_email("DevOpsMate Team", settings.smtp_user, "0000000000", "India"))
print("Test mail sent. Check the inbox (and Spam) of", settings.smtp_user)
PY
