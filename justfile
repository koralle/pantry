# ローカル libSQL を起動して開発DBを作り直す。
# packages/env の値を shell に読み込んでから compose と接続待ちを行う（.local が勝つ）。
local-db-build:
  #!/usr/bin/env bash
  set -euo pipefail
  set -a
  . packages/env/.env.development
  if [[ -f packages/env/.env.development.local ]]; then . packages/env/.env.development.local; fi
  set +a
  docker compose -f apps/web/compose.yaml down >/dev/null 2>&1 || true
  docker compose -f apps/web/compose.yaml up -d
  for _ in $(seq 1 30); do
    if curl -sf "$TURSO_CONNECTION_URL/v2" >/dev/null; then
      pnpm run migrate:dev
      pnpm run db:seed
      exit 0
    fi
    sleep 0.5
  done
  echo "local turso not ready: $TURSO_CONNECTION_URL" >&2
  exit 1

local-db-clean:
  #!/usr/bin/env bash
  set -euo pipefail
  set -a
  . packages/env/.env.development
  if [[ -f packages/env/.env.development.local ]]; then . packages/env/.env.development.local; fi
  set +a
  docker compose -f apps/web/compose.yaml down 2>/dev/null || true
