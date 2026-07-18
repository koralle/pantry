container_name := "pantry-turso"
image_tag := "pantry-turso:local"

local-db-build:
  @container stop {{container_name}} 2>/dev/null || true
  @container delete {{container_name}} 2>/dev/null || true
  @container build --platform linux/arm64 -t {{image_tag}} -f Dockerfile .
  @container run -d --name {{container_name}} --platform linux/arm64 -p 8080:8080 --tmpfs /var/lib/sqld {{image_tag}}
  @pnpm dotenvx run -f .env.development -- pnpm run migrate:dev
  @pnpm dotenvx run -f .env.development -- pnpm tsx scripts/seed.ts

local-db-clean:
  @container stop {{container_name}} 2>/dev/null || true
  @container delete {{container_name}} 2>/dev/null || true
  @container image delete --force {{image_tag}} 2>/dev/null || true
