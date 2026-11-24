#!/usr/bin/env bash
# The only command to run on a new EC2, as the ubuntu user (not root).
#
# The instance must already exist, with the DynamoDB role attached and the
# metadata hop limit set to 2. Hostinger A record for devopsmate.in must
# already point at this server's Elastic IP.
#
#   bash scripts/start.sh
#
# If you uploaded this file on its own, it clones the repo first:
#   bash start.sh
set -euo pipefail

if [ "$(id -u)" -eq 0 ]; then
  echo "Run this as the ubuntu user, not root."
  exit 1
fi

REPO="devopsmate7/DevOpsMate-micro_apps"
GMAIL="devopsmate7@gmail.com"
HERE="$(cd "$(dirname "$0")" && pwd)"

if [ ! -f "$HERE/../docker-compose.yml" ]; then
  read -rsp "GitHub token with read access to ${REPO}: " GH
  echo
  [ -n "$GH" ] || { echo "A GitHub token is required. The repo is private."; exit 1; }
  cd "$HOME"
  rm -rf DevOpsMate-micro_apps
  git clone "https://x-access-token:${GH}@github.com/${REPO}.git" DevOpsMate-micro_apps
  git -C DevOpsMate-micro_apps remote set-url origin "https://github.com/${REPO}.git"
  exec bash "$HOME/DevOpsMate-micro_apps/scripts/start.sh"
fi

ROOT="$(cd "$HERE/.." && pwd)"
cd "$ROOT"

echo "== Checking the instance role =="
IMDS="http://169.254.169.254/latest"
META=$(curl -fsS -m 2 -X PUT "$IMDS/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 60" || true)
ROLE=""
if [ -n "$META" ]; then
  ROLE=$(curl -fsS -m 2 -H "X-aws-ec2-metadata-token: $META" "$IMDS/meta-data/iam/security-credentials/" || true)
fi
if [ -z "$ROLE" ]; then
  echo "No IAM role is attached to this instance."
  echo "Attach the DynamoDB role, set the metadata hop limit to 2, then run this again."
  exit 1
fi
echo "Role: ${ROLE}"

if [ ! -f .env ] || ! grep -q '^SMTP_PASSWORD=.\+' .env; then
  read -rsp "Gmail app password for ${GMAIL} (16 letters, hidden): " PASS
  echo
  PASS="${PASS// /}"
  [ "${#PASS}" -eq 16 ] || { echo "A Gmail app password has 16 letters. Nothing was changed."; exit 1; }
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
    set_var JWT_SECRET "$(openssl rand -hex 32)"
  fi
  chmod 600 .env
  echo "Saved mail settings in ${ROOT}/.env"
fi

echo "== Installing Docker =="
sudo systemctl stop unattended-upgrades || true
while sudo fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do sleep 5; done
sudo apt-get update
sudo apt-get install -y ca-certificates curl git docker.io
sudo apt-get install -y docker-compose-v2 || true
sudo systemctl enable --now docker
if ! sudo docker compose version >/dev/null 2>&1; then
  case "$(uname -m)" in
    x86_64) asset="docker-compose-linux-x86_64" ;;
    aarch64 | arm64) asset="docker-compose-linux-aarch64" ;;
    *) echo "Unsupported CPU: $(uname -m). Use t3.medium (x86_64)."; exit 1 ;;
  esac
  sudo mkdir -p /usr/libexec/docker/cli-plugins /usr/local/lib/docker/cli-plugins
  tmp="$(mktemp)"
  sudo curl -fsSL "https://github.com/docker/compose/releases/download/v2.32.4/${asset}" -o "$tmp"
  sudo install -m 755 "$tmp" /usr/libexec/docker/cli-plugins/docker-compose
  sudo install -m 755 "$tmp" /usr/local/lib/docker/cli-plugins/docker-compose
  sudo rm -f "$tmp"
fi

COMPOSE=(sudo docker compose -f docker-compose.yml -f docker-compose.https.yml)
echo "== Building and starting (several minutes) =="
"${COMPOSE[@]}" up -d --build

echo "== Waiting for the site =="
ok=0
for _ in $(seq 1 36); do
  health=$(curl -fsS --resolve devopsmate.in:443:127.0.0.1 https://devopsmate.in/api/auth/health || true)
  if echo "$health" | grep -q '"mail":"gmail"' \
    && curl -fsS --resolve devopsmate.in:443:127.0.0.1 https://devopsmate.in/api/catalog/courses >/dev/null; then
    ok=1
    break
  fi
  sleep 5
done
if [ "$ok" -ne 1 ]; then
  echo "The site did not become healthy. Health was: ${health:-none}"
  echo "If mail is not gmail, the app password was not saved. If auth says no AWS credentials, set the metadata hop limit to 2."
  "${COMPOSE[@]}" ps
  "${COMPOSE[@]}" logs --tail 40 auth
  exit 1
fi

echo "== Sending a test welcome mail to ${GMAIL} =="
"${COMPOSE[@]}" exec -T auth python - <<'PY'
import asyncio
from app.config import settings
from app.email_service import send_welcome_email

asyncio.run(send_welcome_email("DevOpsMate Team", settings.smtp_user, "0000000000", "India"))
print("Test mail sent to", settings.smtp_user)
PY

echo
echo "Site is up: https://devopsmate.in"
echo "Check the inbox and Spam of ${GMAIL}."
