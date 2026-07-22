container_name := "pantry-turso"
image_tag := "pantry-turso:local"

local-db-build:
  @docker compose down 2>/dev/null || true
  @docker compose up -d
  @for i in $(seq 1 30); do curl -sf http://127.0.0.1:8080/v2 >/dev/null && exit 0; sleep 0.5; done; echo "local turso not ready on :8080" >&2; exit 1
  @pnpm dotenvx run -f .env.development -- pnpm run migrate:dev
  @pnpm dotenvx run -f .env.development -- pnpm tsx scripts/seed.ts

local-db-clean:
  @docker compose down 2>/dev/null || true
