local-db-build:
  @container compose up -d
  @pnpm dotenvx run -f .env.development -- pnpm run migrate:dev
  @pnpm dotenvx run -f .env.development -- pnpm tsx scripts/seed.ts

local-db-clean:
  @container compose down --rmi all --volumes --remove-orphans
