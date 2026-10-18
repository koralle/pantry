import { user } from "@pantry/db/schema/auth-schema";
import { describe, expect, test } from "vitest";

import { seedUser, withPersistenceDb } from "./migrated-db";

describe("本番 migration を適用した libSQL server", () => {
  const persistence = withPersistenceDb();

  test("Pantry のテーブルがそろっている", async () => {
    const result = await persistence
      .getClient()
      .execute(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '__drizzle%' ORDER BY name"
      );

    expect(result.rows.map((row) => row["name"])).toStrictEqual(
      expect.arrayContaining(["bookmark_tags", "bookmarks", "tags", "users"])
    );
  });

  test("各テストは空のテーブルから始まる", async () => {
    const db = persistence.getDb();
    await seedUser(db, "user-a");

    await expect(db.select({ id: user.id }).from(user)).resolves.toStrictEqual([
      { id: "user-a" },
    ]);
  });

  test("前のテストの行は残らない", async () => {
    await expect(
      persistence.getDb().select().from(user)
    ).resolves.toStrictEqual([]);
  });
});
