local-db-build:
  @podman compose up -d
  @bun dotenvx run -f .env.development -- bun drizzle-kit migrate
  @bun dotenvx run -f .env.development -- bun scripts/create-user.ts

local-db-clean:
  @podman compose down --rmi all --volumes --remove-orphans
