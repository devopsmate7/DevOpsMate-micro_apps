#!/usr/bin/env bash
# Runs on the EC2 instance. Pulls this repo and rebuilds the containers.
# .env is untracked, so the reset below does not remove it.
set -euo pipefail
cd /opt/devopsmate
git fetch origin main
git reset --hard origin/main
docker compose -f docker-compose.ec2.yml up -d --build
docker image prune -f
