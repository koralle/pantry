import { createClient } from "@libsql/client";
import { migrationsFolder } from "@pantry/db/migrations";
import { startLibsqlServer } from "@pantry/test-support/libsql";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import type { TestProject } from "vitest/node";

async function applyProductionMigrations(url: string): Promise<void> {
  const client = createClient({ url });
  try {
    const db = drizzle({ client });
    await migrate(db, { migrationsFolder });
  } finally {
    client.close();
  }
}

export default async function setup(
  project: TestProject
): Promise<() => Promise<void>> {
  const { container, url } = await startLibsqlServer();

  try {
    await applyProductionMigrations(url);
    project.provide("libsqlUrl", url);
  } catch (error) {
    await container.stop();
    throw error;
  }

  return async () => {
    await container.stop();
  };
}
