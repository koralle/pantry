import { tagsTable } from "@pantry/db/schema/tag";
import { eq, sql } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import {
  parseTagId,
  parseTagName,
  parseUserId,
  seedTag,
  seedUser,
  withTestDb,
} from "../../../../test/db/migrated-db";
import type { UpdateTagInput } from "../../application/update-tag";
import { updateTag } from "./index";

const testDb = withTestDb();

type TagFields = Partial<
  Pick<UpdateTagInput, "pinned" | "sortOrder" | "color">
>;

function createCommand({
  userId,
  id,
  name,
  pinned = false,
  sortOrder = 0,
  color = null,
}: { userId: string; id: number; name: string } & TagFields): UpdateTagInput {
  return {
    color,
    id: parseTagId(id),
    name: parseTagName(name),
    pinned,
    sortOrder,
    userId: parseUserId(userId),
  };
}

describe(updateTag, { concurrent: false }, () => {
  test("所有者が全フィールドを更新し TagId を受け取る", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    const id = await seedTag(db, { name: "Old", userId: "user-a" });

    const result = await updateTag(
      db,
      createCommand({
        color: "#123456",
        id,
        name: " Work ",
        pinned: true,
        sortOrder: 4,
        userId: "user-a",
      })
    );

    expect(result).toStrictEqual({ id: parseTagId(id), kind: "updated" });
    const [row] = await db
      .select({
        color: tagsTable.color,
        name: tagsTable.name,
        normalizedName: tagsTable.normalizedName,
        pinned: tagsTable.pinned,
        sortOrder: tagsTable.sortOrder,
      })
      .from(tagsTable)
      .where(eq(tagsTable.id, id));
    expect(row).toStrictEqual({
      color: "#123456",
      name: "Work",
      normalizedName: "work",
      pinned: true,
      sortOrder: 4,
    });
  });

  test("存在しない id は not-found を返す", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");

    const result = await updateTag(
      db,
      createCommand({ id: 999, name: "Missing", userId: "user-a" })
    );

    expect(result).toStrictEqual({ kind: "not-found" });
  });

  test("別ユーザーのタグは not-found を返し変更しない", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    await seedUser(db, "user-b");
    const id = await seedTag(db, {
      color: "#000000",
      name: "Private",
      pinned: false,
      sortOrder: 1,
      userId: "user-a",
    });

    const result = await updateTag(
      db,
      createCommand({
        color: "#ffffff",
        id,
        name: "Stolen",
        pinned: true,
        sortOrder: 9,
        userId: "user-b",
      })
    );

    expect(result).toStrictEqual({ kind: "not-found" });
    const [row] = await db
      .select({
        color: tagsTable.color,
        name: tagsTable.name,
        normalizedName: tagsTable.normalizedName,
        pinned: tagsTable.pinned,
        sortOrder: tagsTable.sortOrder,
      })
      .from(tagsTable)
      .where(eq(tagsTable.id, id));
    expect(row).toStrictEqual({
      color: "#000000",
      name: "Private",
      normalizedName: "private",
      pinned: false,
      sortOrder: 1,
    });
  });

  test("同一ユーザーの正規化名が衝突すると name-conflict を返し変更しない", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    await seedTag(db, { name: "Work", userId: "user-a" });
    const id = await seedTag(db, {
      color: "#111111",
      name: "Personal",
      pinned: false,
      sortOrder: 2,
      userId: "user-a",
    });

    const result = await updateTag(
      db,
      createCommand({
        color: "#eeeeee",
        id,
        name: "WORK",
        pinned: true,
        sortOrder: 8,
        userId: "user-a",
      })
    );

    expect(result).toStrictEqual({ kind: "name-conflict" });
    const [row] = await db
      .select({
        color: tagsTable.color,
        name: tagsTable.name,
        normalizedName: tagsTable.normalizedName,
        pinned: tagsTable.pinned,
        sortOrder: tagsTable.sortOrder,
      })
      .from(tagsTable)
      .where(eq(tagsTable.id, id));
    expect(row).toStrictEqual({
      color: "#111111",
      name: "Personal",
      normalizedName: "personal",
      pinned: false,
      sortOrder: 2,
    });
  });

  test("所有確認の後に行が消えた競合は not-found を返す", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    const id = await seedTag(db, { name: "Vanish", userId: "user-a" });

    // 所有 SELECT と UPDATE の隙間で別接続が削除した状況を、BEFORE UPDATE トリガで再現する。
    // 行を消すと UPDATE の対象が消えるため RETURNING は空になり、404 仕分けの分岐に入る。
    await db.run(sql`
      CREATE TRIGGER vanish_after_check BEFORE UPDATE ON tags
      BEGIN
        DELETE FROM tags WHERE id = OLD.id;
      END
    `);

    const result = await updateTag(
      db,
      createCommand({ id, name: "Renamed", sortOrder: 3, userId: "user-a" })
    );

    expect(result).toStrictEqual({ kind: "not-found" });
  });
});
