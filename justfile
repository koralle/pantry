local-db-build:
  @podman compose up -d

local-db-clean:
  @podman compose down --rmi all --volumes --remove-orphans
