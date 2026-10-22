#!/usr/bin/env bash
# Read-only check that the verification instance is the one to drive.
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
SKILL_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
RUN_DIR="$SKILL_DIR/run"

set -a
. "$SKILL_DIR/env/verify.env"
set +a
EXPECTED_URL="$TURSO_CONNECTION_URL"
APP_URL="$BETTER_AUTH_URL"

if ! docker inspect --format '{{.State.Running}}' "${TURSO_PROJECT:-pantry}-turso" | grep -qx true; then
  echo "doctor fail: container ${TURSO_PROJECT}-turso is not running" >&2
  exit 1
fi

if ! docker port "${TURSO_PROJECT}-turso" 8080 | grep -q ":${TURSO_PORT}$"; then
  echo "doctor fail: container ${TURSO_PROJECT}-turso does not publish $TURSO_PORT" >&2
  exit 1
fi

curl -sf "$EXPECTED_URL/health" >/dev/null
curl -sf "$APP_URL/sign-in" | grep -q "Pantry"
if ! curl -sf -X POST "$APP_URL/rpc/health" -H 'content-type: application/json' -d '{}' |
  grep -q '"status":"ok"'; then
  echo "doctor fail: $APP_URL/rpc/health did not reach pantry-api" >&2
  exit 1
fi

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
