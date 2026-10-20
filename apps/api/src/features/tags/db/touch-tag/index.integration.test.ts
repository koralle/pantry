import type { AppDb } from "@pantry/db";
import { tagsTable } from "@pantry/db/schema/tag";
import * as v from "valibot";
import { describe, expect, test } from "vitest";

import {
  parseTagName,
  parseUserId,
  seedUser,
  withTestDb,
} from "../../../../test/db/migrated-db";
import type { InsertTagInput } from "../../application/create-tag";
import type { TouchTagInput } from "../../application/touch-tag";
import { insertTag } from "../insert-tag";
import { touchTag } from "./index";

const testDb = withTestDb();

async function createOwnedTag(db: AppDb, userId: string, name: string) {
  const input: InsertTagInput = {
    color: null,
    name: parseTagName(name),
    pinned: false,
    sortOrder: 0,
    userId: parseUserId(userId),
  };
  const result = await insertTag(db, input);
  if (result.kind !== "created") {
    throw new Error("tag creation failed in test setup");
  }
  return result.id;
}

function touchInput(userId: string, id: number): TouchTagInput {
  return {
    id: v.parse(v.pipe(v.number(), v.brand("TagId")), id),
    userId: parseUserId(userId),
  };
}

describe(touchTag, () => {
  test("actor のタグの lastUsedAt を更新し touched を返す", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    const id = await createOwnedTag(db, "user-a", "Work");

    const before = await db
      .select({ lastUsedAt: tagsTable.lastUsedAt })
      .from(tagsTable);
    expect(before[0]?.lastUsedAt).toBeNull();

    const result = await touchTag(db, touchInput("user-a", Number(id)));

    expect(result).toStrictEqual({ kind: "touched" });
    const after = await db
      .select({ lastUsedAt: tagsTable.lastUsedAt })
      .from(tagsTable);
    expect(after[0]?.lastUsedAt).not.toBeNull();
  });

  test("別ユーザーのタグは更新せず not-found を返す", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    await seedUser(db, "user-b");
    const id = await createOwnedTag(db, "user-b", "Work");

    const result = await touchTag(db, touchInput("user-a", Number(id)));

    expect(result).toStrictEqual({ kind: "not-found" });
    const rows = await db
      .select({ lastUsedAt: tagsTable.lastUsedAt })
      .from(tagsTable);
    expect(rows[0]?.lastUsedAt).toBeNull();
  });

  test("存在しない id は not-found を返す", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");

    const result = await touchTag(db, touchInput("user-a", 999));

    expect(result).toStrictEqual({ kind: "not-found" });
  });

  test("同一タグへの並行 touch は両方 touched になり、行は1件のまま", async () => {
    const db = testDb.getDb();
    await seedUser(db, "user-a");
    const id = await createOwnedTag(db, "user-a", "Work");

    const input = touchInput("user-a", Number(id));
    const [first, second] = await Promise.all([
      touchTag(db, input),
      touchTag(db, input),
    ]);

    expect(first).toStrictEqual({ kind: "touched" });
    expect(second).toStrictEqual({ kind: "touched" });
    const rows = await db
      .select({ lastUsedAt: tagsTable.lastUsedAt })
      .from(tagsTable);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.lastUsedAt).not.toBeNull();
  });
});
