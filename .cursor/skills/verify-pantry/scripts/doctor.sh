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

if [[ ! -f .env.local ]] || ! grep -q "# pantry-verify-override" .env.local; then
  echo "doctor fail: verification env override is missing" >&2
  exit 1
fi

resolved=$(
  ./node_modules/.bin/varlock run -- \
    node -e 'process.stdout.write((process.env.TURSO_CONNECTION_URL ?? "") + " " + (process.env.BETTER_AUTH_URL ?? ""))'
)
if [[ "$resolved" != "$EXPECTED_URL $APP_URL" ]]; then
  echo "doctor fail: resolved '$resolved'" >&2
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
