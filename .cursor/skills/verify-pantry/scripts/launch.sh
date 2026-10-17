#!/usr/bin/env bash
# Start an isolated Pantry for verification. Does not attach to port 8080.
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
SKILL_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
ROOT=$(cd "$SKILL_DIR/../../.." && pwd)
APP="$ROOT/apps/web"
RUN_DIR="$SKILL_DIR/run"
ENV_DIR="$SKILL_DIR/env"
EXPECTED_URL="http://127.0.0.1:18080"
APP_URL="http://127.0.0.1:4173"

mkdir -p "$RUN_DIR"

cd "$APP"

LOCAL_ENV="$APP/.env.development.local"
MARKER="# pantry-verify-override"

remove_local_env() {
  if [[ -f "$LOCAL_ENV" ]] && grep -q "$MARKER" "$LOCAL_ENV"; then
    rm -f "$LOCAL_ENV"
  fi
}

if lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "refusing to launch: port 3000 is in use. stop pnpm dev first so the verification env file cannot retarget it" >&2
  exit 1
fi

if [[ -f "$LOCAL_ENV" ]]; then
  echo "refusing to launch: $LOCAL_ENV already exists" >&2
  exit 1
fi

cat >"$LOCAL_ENV" <<'EOF'
# pantry-verify-override
# Temporary. cleanup.sh deletes this file. Do not point pnpm dev at it.
TURSO_PROJECT=pantry-verify
TURSO_PORT=18080
TURSO_CONNECTION_URL=http://127.0.0.1:18080
TURSO_AUTH_TOKEN=pantry-verify-token
BETTER_AUTH_URL=http://127.0.0.1:4173
BETTER_AUTH_SECRET=pantry-verify-secret-at-least-32-characters
EOF

trap remove_local_env EXIT

resolved=$(
  ./node_modules/.bin/varlock run -- \
    node -e 'process.stdout.write((process.env.TURSO_CONNECTION_URL ?? "") + " " + (process.env.BETTER_AUTH_URL ?? ""))'
)
if [[ "$resolved" != "$EXPECTED_URL $APP_URL" ]]; then
  echo "refusing to launch: resolved '$resolved', want $EXPECTED_URL $APP_URL" >&2
  exit 1
fi

export TURSO_PROJECT=pantry-verify
export TURSO_PORT=18080

docker compose --project-name pantry-verify up -d

for _ in $(seq 1 60); do
  if curl -sf "$EXPECTED_URL/health" >/dev/null; then
    break
  fi
  sleep 0.5
done
curl -sf "$EXPECTED_URL/health" >/dev/null

(cd "$ROOT/packages/db" &&
  ./node_modules/.bin/varlock run --path ../../apps/web/ -- \
    ./node_modules/.bin/drizzle-kit migrate)
./node_modules/.bin/varlock run -- \
  ./node_modules/.bin/tsx scripts/seed.ts

if lsof -nP -iTCP:4173 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "refusing to launch: 127.0.0.1:4173 is already in use. run cleanup.sh" >&2
  exit 1
fi

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

for _ in $(seq 1 90); do
  if grep -q "Local:   http://127.0.0.1:4173/" "$RUN_DIR/vite.log" &&
    curl -sf "$APP_URL/sign-in" | grep -q "Pantry"; then
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
