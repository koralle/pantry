#!/usr/bin/env bash
# Start an isolated Pantry for verification. Does not attach to port 8080.
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
SKILL_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
ROOT=$(cd "$SKILL_DIR/../../.." && pwd)
APP="$ROOT/apps/web"
API="$ROOT/apps/api"
RUN_DIR="$SKILL_DIR/run"
ENV_DIR="$SKILL_DIR/env"
EXPECTED_URL="http://127.0.0.1:18080"
APP_URL="http://127.0.0.1:4173"

mkdir -p "$RUN_DIR"

cd "$APP"

LOCAL_ENV="$APP/.env.local"
API_LOCAL_ENV="$API/.env.local"
MARKER="# pantry-verify-override"

remove_local_env() {
  for file in "$LOCAL_ENV" "$API_LOCAL_ENV"; do
    if [[ -f "$file" ]] && grep -q "$MARKER" "$file"; then
      rm -f "$file"
    fi
  done
}

# vite dev starts pantry-api as an auxiliary worker that reads apps/api's env, so
# a running `pnpm dev` (3000) or `pnpm dev:api` (8787) could pick up the override.
for port in 3000 8787; do
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "refusing to launch: port $port is in use. stop pnpm dev / dev:api first so the verification env files cannot retarget it" >&2
    exit 1
  fi
done

for file in "$LOCAL_ENV" "$API_LOCAL_ENV"; do
  if [[ -f "$file" ]]; then
    echo "refusing to launch: $file already exists" >&2
    exit 1
  fi
done

trap remove_local_env EXIT

# Web reads the database directly; Better Auth runs in pantry-api.
cat >"$LOCAL_ENV" <<'EOF'
# pantry-verify-override
# Temporary. cleanup.sh deletes this file. Do not point pnpm dev at it.
TURSO_PROJECT=pantry-verify
TURSO_PORT=18080
TURSO_CONNECTION_URL=http://127.0.0.1:18080
TURSO_AUTH_TOKEN=pantry-verify-token
EOF

cat >"$API_LOCAL_ENV" <<'EOF'
# pantry-verify-override
# Temporary. cleanup.sh deletes this file. Do not point pnpm dev at it.
TURSO_CONNECTION_URL=http://127.0.0.1:18080
TURSO_AUTH_TOKEN=pantry-verify-token
BETTER_AUTH_URL=http://127.0.0.1:4173
BETTER_AUTH_SECRET=pantry-verify-secret-at-least-32-characters
EOF

resolved=$(
  ./node_modules/.bin/varlock run -- \
    node -e 'process.stdout.write(process.env.TURSO_CONNECTION_URL ?? "")'
)
api_resolved=$(
  cd "$API" &&
    ./node_modules/.bin/varlock run -- \
      node -e 'process.stdout.write((process.env.TURSO_CONNECTION_URL ?? "") + " " + (process.env.BETTER_AUTH_URL ?? ""))'
)
if [[ "$resolved" != "$EXPECTED_URL" || "$api_resolved" != "$EXPECTED_URL $APP_URL" ]]; then
  echo "refusing to launch: web resolved '$resolved', api resolved '$api_resolved', want $EXPECTED_URL / $EXPECTED_URL $APP_URL" >&2
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
# seed lives in apps/api (it builds Better Auth with createAuth) and reads apps/api's env.
(cd "$API" &&
  ./node_modules/.bin/varlock run -- \
    ./node_modules/.bin/tsx scripts/seed.ts)

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
