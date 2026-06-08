#!/usr/bin/env bash
set -euo pipefail

# Script to test nginx config and restart the nginx service via docker-compose
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[nginx-fix] testing nginx configuration from $ROOT_DIR/infra/nginx"
docker run --rm -v "$PWD/infra/nginx":/etc/nginx:ro nginx:1.27-alpine nginx -t

echo "[nginx-fix] configuration OK — recreating nginx container"
if docker-compose ps nginx >/dev/null 2>&1; then
  docker-compose up -d --force-recreate --no-deps nginx
else
  docker-compose up -d nginx
fi

sleep 2
echo "[nginx-fix] nginx logs (tail 200):"
docker logs --tail 200 osp_nginx || true

echo "[nginx-fix] done"
