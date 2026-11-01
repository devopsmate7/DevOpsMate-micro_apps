#!/usr/bin/env bash
# Ubuntu Server. Run from the cloned repo, as the ubuntu user:
#   bash scripts/bootstrap-ec2.sh
# Installs Docker and starts the site on port 80.
set -euo pipefail

if [ "$(id -u)" -eq 0 ]; then
  echo "Run this as the ubuntu user, not root."
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== Installing Docker =="
sudo apt-get update
sudo apt-get install -y ca-certificates curl git docker.io
sudo apt-get install -y docker-compose-v2 || true
sudo systemctl enable --now docker

if ! sudo docker compose version >/dev/null 2>&1; then
  echo "== Installing Docker Compose =="
  case "$(uname -m)" in
    x86_64) asset="docker-compose-linux-x86_64" ;;
    aarch64 | arm64) asset="docker-compose-linux-aarch64" ;;
    *)
      echo "Unsupported CPU: $(uname -m). Use an x86_64 instance such as t3.medium."
      exit 1
      ;;
  esac
  sudo mkdir -p /usr/libexec/docker/cli-plugins /usr/local/lib/docker/cli-plugins
  tmp="$(mktemp)"
  sudo curl -fsSL "https://github.com/docker/compose/releases/download/v2.32.4/${asset}" -o "$tmp"
  sudo install -m 755 "$tmp" /usr/libexec/docker/cli-plugins/docker-compose
  sudo install -m 755 "$tmp" /usr/local/lib/docker/cli-plugins/docker-compose
  sudo rm -f "$tmp"
fi
sudo docker compose version

# An older setup published the frontend itself on port 80. Caddy needs that port.
rm -f docker-compose.public.yml
COMPOSE=(sudo docker compose -f docker-compose.yml -f docker-compose.https.yml)

echo "== Building and starting containers (this takes several minutes) =="
"${COMPOSE[@]}" up -d --build

echo "== Waiting for HTTPS =="
ok=0
for _ in $(seq 1 36); do
  if curl -fsS --resolve devopsmate7.duckdns.org:443:127.0.0.1 https://devopsmate7.duckdns.org/api/auth/health >/dev/null \
    && curl -fsS --resolve devopsmate7.duckdns.org:443:127.0.0.1 https://devopsmate7.duckdns.org/api/catalog/courses >/dev/null \
    && curl -fsS --resolve devopsmate7.duckdns.org:443:127.0.0.1 https://devopsmate7.duckdns.org/api/notice/active >/dev/null; then
    ok=1
    break
  fi
  sleep 5
done

if [ "$ok" -ne 1 ]; then
  echo "The site did not become healthy. Recent container logs:"
  "${COMPOSE[@]}" ps
  "${COMPOSE[@]}" logs --tail 60
  exit 1
fi

TOKEN=$(curl -fsS -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 60" || true)
PUBLIC_IP=""
if [ -n "${TOKEN}" ]; then
  PUBLIC_IP=$(curl -fsS -H "X-aws-ec2-metadata-token: ${TOKEN}" http://169.254.169.254/latest/meta-data/public-ipv4 || true)
fi

echo
"${COMPOSE[@]}" ps
echo
echo "Site by name: https://devopsmate7.duckdns.org/"
if [ -n "${PUBLIC_IP}" ]; then
  echo "Server IP:    ${PUBLIC_IP}"
fi
echo "Security group must allow ports 80 and 443 from anywhere."
echo "Put the Elastic IP in DuckDNS and click update ip, if you have not already."
