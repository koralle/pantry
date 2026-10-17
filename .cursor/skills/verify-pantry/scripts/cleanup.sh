#!/usr/bin/env bash
# Stop only the verification instance. Leaves artifacts/ in place.
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
SKILL_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
ROOT=$(cd "$SKILL_DIR/../../.." && pwd)
APP="$ROOT/apps/web"
RUN_DIR="$SKILL_DIR/run"

if [[ -f "$RUN_DIR/vite.pid" ]]; then
  pid=$(cat "$RUN_DIR/vite.pid")
  if kill -0 "$pid" 2>/dev/null; then
    pkill -P "$pid" 2>/dev/null || true
    kill "$pid" 2>/dev/null || true
    for _ in $(seq 1 20); do
      if ! kill -0 "$pid" 2>/dev/null; then
        break
      fi
      sleep 0.25
    done
    if kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" 2>/dev/null || true
    fi
  fi
fi

# The first launch can leave a Vite child on 4173 after its parent pid is gone.
if lsof -nP -iTCP:4173 -sTCP:LISTEN >/dev/null 2>&1; then
  listener=$(lsof -nP -t -iTCP:4173 -sTCP:LISTEN | head -n 1)
  if [[ -n "$listener" ]]; then
    kill "$listener" 2>/dev/null || true
  fi
fi

cd "$APP"
for local_env in "$APP/.env.local" "$ROOT/apps/api/.env.local" "$ROOT/apps/api/scripts/.env.local"; do
  if [[ -f "$local_env" ]] && grep -q "# pantry-verify-override" "$local_env"; then
    rm -f "$local_env"
  fi
done

export TURSO_PROJECT=pantry-verify
export TURSO_PORT=18080
docker compose --project-name pantry-verify down || true

rm -rf "$RUN_DIR"
echo "cleaned verification instance; artifacts kept in $SKILL_DIR/artifacts"
