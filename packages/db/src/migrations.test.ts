import { expect, it } from "vitest";

import { migrationsFolder } from "./migrations";

it("migrationsFolder は packages/db/drizzle を指す", () => {
  expect(migrationsFolder).toMatch(/packages[/\\]db[/\\]drizzle$/u);
});
