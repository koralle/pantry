#!/usr/bin/env bash
# Start an isolated Pantry for verification. Does not attach to port 8080.
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
SKILL_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
ROOT=$(cd "$SKILL_DIR/../../.." && pwd)
APP="$ROOT/apps/web"
API="$ROOT/apps/api"
RUN_DIR="$SKILL_DIR/run"
APP_URL="http://127.0.0.1:4173"
EXPECTED_URL="http://127.0.0.1:18080"

mkdir -p "$RUN_DIR"

cd "$APP"

# Every tool loads packages/env first, but an exported value wins. Exporting the
# verification values here retargets the whole stack (vite dev workers,
# drizzle-kit, seed) without touching the development env files.
set -a
. "$SKILL_DIR/env/verify.env"
set +a

if lsof -nP -iTCP:4173 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "refusing to launch: 127.0.0.1:4173 is already in use. run cleanup.sh" >&2
  exit 1
fi

docker compose --project-name pantry-verify up -d

for _ in $(seq 1 60); do
  if curl -sf "$EXPECTED_URL/health" >/dev/null; then
    break
  fi
  sleep 0.5
done
curl -sf "$EXPECTED_URL/health" >/dev/null

(cd "$ROOT/packages/db" && ./node_modules/.bin/drizzle-kit migrate)
(cd "$API" && ./node_modules/.bin/tsx scripts/seed.ts)

if [[ -f "$RUN_DIR/vite.pid" ]]; then
  old=$(cat "$RUN_DIR/vite.pid")
  if kill -0 "$old" 2>/dev/null; then
    echo "verification vite already running as pid $old" >&2
    exit 1
  fi
fi

./node_modules/.bin/vite dev --port 4173 --strictPort --host 127.0.0.1 \
  >"$RUN_DIR/vite.log" 2>&1 &
vite_pid=$!
echo "$vite_pid" >"$RUN_DIR/vite.pid"

stop_vite() {
  if [[ -n "${vite_pid:-}" ]] && kill -0 "$vite_pid" 2>/dev/null; then
    pkill -P "$vite_pid" 2>/dev/null || true
    kill "$vite_pid" 2>/dev/null || true
  fi
}
trap stop_vite INT TERM

# Ready only when the web page renders and the pantry-api auxiliary worker answers
# /rpc/health through the web origin (Service Binding forwarding).
api_healthy() {
  curl -sf -X POST "$APP_URL/rpc/health" \
    -H 'content-type: application/json' -d '{}' |
    grep -q '"status":"ok"'
}

for _ in $(seq 1 90); do
  if grep -q "Local:   http://127.0.0.1:4173/" "$RUN_DIR/vite.log" &&
    curl -sf "$APP_URL/sign-in" | grep -q "Pantry" &&
    api_healthy; then
    echo "ready $APP_URL"
    wait "$vite_pid"
    exit 0
  fi
  if ! kill -0 "$vite_pid" 2>/dev/null; then
    echo "vite exited before ready. see $RUN_DIR/vite.log" >&2
    exit 1
  fi
  sleep 1
done

echo "vite did not become ready. see $RUN_DIR/vite.log" >&2
stop_vite
exit 1
