import { expect, test } from "vitest";

import { migrationsFolder } from "./migrations";

test("migrationsFolder は packages/db/drizzle を指す", () => {
  expect(migrationsFolder).toMatch(/packages[/\\]db[/\\]drizzle$/u);
});
