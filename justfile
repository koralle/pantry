local-db-build:
  @podman compose up -d
  @pnpm dotenvx run -f .env.development -- pnpm run migrate:dev
  @pnpm dotenvx run -f .env.development -- pnpm tsx scripts/create-user.ts

local-db-clean:
  @podman compose down --rmi all --volumes --remove-orphans
