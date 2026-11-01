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
COMPOSE_VERSION="v2.32.4"

echo "== Installing Docker =="
sudo apt-get update
sudo apt-get install -y ca-certificates curl git docker.io
sudo systemctl enable --now docker

echo "== Installing Docker Compose ${COMPOSE_VERSION} =="
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -fsSL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
sudo docker compose version

# The repo publishes the site on 3000. This host should answer on 80.
sed -i 's/"3000:80"/"80:80"/' docker-compose.yml

# The commerce image runs as a non-root user, but a new data volume is owned
# by root. Run that one container as root so it can create its database file.
cat > docker-compose.public.yml << 'EOF'
services:
  commerce:
    user: "0:0"
EOF

echo "== Building and starting containers (this takes several minutes) =="
sudo docker compose -f docker-compose.yml -f docker-compose.public.yml up -d --build

echo "== Waiting for the site =="
for _ in $(seq 1 30); do
  if curl -fsS http://127.0.0.1/ >/dev/null; then
    break
  fi
  sleep 5
done

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
