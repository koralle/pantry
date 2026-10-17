#!/usr/bin/env bash
# Read-only check that the verification instance is the one to drive.
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
SKILL_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
ROOT=$(cd "$SKILL_DIR/../../.." && pwd)
APP="$ROOT/apps/web"
RUN_DIR="$SKILL_DIR/run"
ENV_DIR="$SKILL_DIR/env"
EXPECTED_URL="http://127.0.0.1:18080"
APP_URL="http://127.0.0.1:4173"

cd "$APP"

for local_env in .env.local ../api/.env.local; do
  if [[ ! -f "$local_env" ]] || ! grep -q "# pantry-verify-override" "$local_env"; then
    echo "doctor fail: verification env override $local_env is missing" >&2
    exit 1
  fi
done

resolved=$(
  ./node_modules/.bin/varlock run -- \
    node -e 'process.stdout.write(process.env.TURSO_CONNECTION_URL ?? "")'
)
api_resolved=$(
  cd ../api &&
    ./node_modules/.bin/varlock run -- \
      node -e 'process.stdout.write((process.env.TURSO_CONNECTION_URL ?? "") + " " + (process.env.BETTER_AUTH_URL ?? ""))'
)
if [[ "$resolved" != "$EXPECTED_URL" || "$api_resolved" != "$EXPECTED_URL $APP_URL" ]]; then
  echo "doctor fail: web resolved '$resolved', api resolved '$api_resolved'" >&2
  exit 1
fi

if ! docker inspect --format '{{.State.Running}}' pantry-verify-turso | grep -qx true; then
  echo "doctor fail: container pantry-verify-turso is not running" >&2
  exit 1
fi

curl -sf "$EXPECTED_URL/health" >/dev/null
curl -sf "$APP_URL/sign-in" | grep -q "Pantry"

if [[ ! -f "$RUN_DIR/vite.pid" ]]; then
  echo "doctor fail: no vite pid file" >&2
  exit 1
fi
pid=$(cat "$RUN_DIR/vite.pid")
if ! kill -0 "$pid" 2>/dev/null; then
  echo "doctor fail: vite pid $pid is not running" >&2
  exit 1
fi

echo "doctor ok $APP_URL pid=$pid db=$EXPECTED_URL"
