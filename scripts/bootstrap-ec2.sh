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

# Keep the repo's port 3000 for laptop use, and also publish port 80 on this server.
cat > docker-compose.public.yml << 'EOF'
services:
  frontend:
    ports:
      - "80:80"
EOF

echo "== Building and starting containers (this takes several minutes) =="
sudo docker compose -f docker-compose.yml -f docker-compose.public.yml up -d --build

echo "== Waiting for the site =="
ok=0
for _ in $(seq 1 36); do
  if curl -fsS http://127.0.0.1/ >/dev/null \
    && curl -fsS http://127.0.0.1/api/auth/health >/dev/null \
    && curl -fsS http://127.0.0.1/api/catalog/courses >/dev/null \
    && curl -fsS http://127.0.0.1/api/notice/active >/dev/null; then
    ok=1
    break
  fi
  sleep 5
done

if [ "$ok" -ne 1 ]; then
  echo "The site did not become healthy. Recent container logs:"
  sudo docker compose -f docker-compose.yml -f docker-compose.public.yml ps
  sudo docker compose -f docker-compose.yml -f docker-compose.public.yml logs --tail 60
  exit 1
fi

TOKEN=$(curl -fsS -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 60" || true)
PUBLIC_IP=""
if [ -n "${TOKEN}" ]; then
  PUBLIC_IP=$(curl -fsS -H "X-aws-ec2-metadata-token: ${TOKEN}" http://169.254.169.254/latest/meta-data/public-ipv4 || true)
fi

echo
sudo docker compose -f docker-compose.yml -f docker-compose.public.yml ps
echo
echo "Site on this machine: http://127.0.0.1/"
if [ -n "${PUBLIC_IP}" ]; then
  echo "Site by IP:           http://${PUBLIC_IP}/"
fi
echo "Site by name:         http://devopsmate7.duckdns.org/"
echo "Put the Elastic IP in DuckDNS and click update ip, if you have not already."
