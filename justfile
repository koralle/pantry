local-db-build:
  @pnpm exec varlock run -- docker compose down 2>/dev/null || true
  @pnpm exec varlock run -- docker compose up -d
  @for i in $(seq 1 30); do curl -sf "$(pnpm exec varlock printenv TURSO_CONNECTION_URL)/v2" >/dev/null && exit 0; sleep 0.5; done; echo "local turso not ready" >&2; exit 1
  @pnpm run migrate:dev
  @pnpm run db:seed

local-db-clean:
  @pnpm exec varlock run -- docker compose down 2>/dev/null || true
