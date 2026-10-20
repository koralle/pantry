import { describe, expect, test } from "vitest";

import { withTestDb } from "./migrated-db";

describe("本番 migration を適用した libSQL server", () => {
  const testDb = withTestDb();

  test("Pantry のテーブルがそろっている", async () => {
    const result = await testDb
      .getClient()
      .execute(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '__drizzle%' ORDER BY name"
      );

    expect(result.rows.map((row) => row["name"])).toStrictEqual(
      expect.arrayContaining(["bookmark_tags", "bookmarks", "tags", "users"])
    );
  });
});
