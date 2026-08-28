#!/usr/bin/env bash
set -euo pipefail

readonly container_name="pantry-turso"
readonly image_tag="pantry-turso:cursor-cloud"
readonly health_url="http://127.0.0.1:8080/v2"

sudo service docker start

docker rm -f "${container_name}" >/dev/null 2>&1 || true

docker build \
  --file Dockerfile \
  --tag "${image_tag}" \
  .

docker run \
  --detach \
  --name "${container_name}" \
  --publish 127.0.0.1:8080:8080 \
  --tmpfs /var/lib/sqld \
  "${image_tag}" \
  >/dev/null

for _ in $(seq 1 30); do
  if curl --fail --silent "${health_url}" >/dev/null; then
    exit 0
  fi

  sleep 0.5
done

echo "LibSQL が ${health_url} で起動可能になる前にタイムアウトしました。" >&2
docker logs "${container_name}" >&2 || true
exit 1
