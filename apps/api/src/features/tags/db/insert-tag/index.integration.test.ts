import { readFileSync } from "node:fs";
import { join } from "node:path";

import { tagNameSchema } from "@pantry/api-contract/schemas/tag-values";
import { tagsTable } from "@pantry/db/schema/tag";
import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { userIdSchema } from "../../../../domain/user-id";
import { seedUser, withPersistenceDb } from "../../../../test/db/migrated-db";
import type { InsertTagInput } from "../../application/create-tag";
import { insertTag } from "./index";

const adapterDir = import.meta.dirname;
const persistence = withPersistenceDb();

function parseUserId(value: string) {
  return v.parse(userIdSchema, value);
}

function parseName(value: string) {
  return v.parse(tagNameSchema, value);
}

function createCommand(
  userId: string,
  name: string,
  extras: Partial<Pick<InsertTagInput, "pinned" | "sortOrder" | "color">> = {}
): InsertTagInput {
  return {
    color: extras.color ?? null,
    name: parseName(name),
    pinned: extras.pinned ?? false,
    sortOrder: extras.sortOrder ?? 0,
    userId: parseUserId(userId),
  };
}

describe(insertTag, () => {
  test("同一ユーザーの正規化名が重なると name-conflict を返す", async () => {
    const db = persistence.getDb();
    await seedUser(db, "user-a");

    const first = await insertTag(db, createCommand("user-a", "Work"));
    const second = await insertTag(db, createCommand("user-a", "work"));

    expect(first.kind).toBe("created");
    expect(second).toStrictEqual({ kind: "name-conflict" });
  });

  test("別ユーザーなら同じタグ名を作成できる", async () => {
    const db = persistence.getDb();
    await seedUser(db, "user-a");
    await seedUser(db, "user-b");

    const first = await insertTag(db, createCommand("user-a", "Work"));
    const second = await insertTag(db, createCommand("user-b", "Work"));

    expect(first.kind).toBe("created");
    expect(second.kind).toBe("created");
  });

  test("同一ユーザー・同一名の同時 INSERT は created と name-conflict になる", async () => {
    const db = persistence.getDb();
    await seedUser(db, "user-a");

    const [left, right] = await Promise.all([
      insertTag(db, createCommand("user-a", "Inbox")),
      insertTag(db, createCommand("user-a", "Inbox")),
    ]);
    const kinds = [left.kind, right.kind].toSorted();
    expect(kinds).toStrictEqual(["created", "name-conflict"]);

    const rows = await db.select({ id: tagsTable.id }).from(tagsTable);
    expect(rows).toHaveLength(1);
  });

  test("汎用 UNIQUE 判定は import しない", () => {
    const source = readFileSync(join(adapterDir, "index.ts"), "utf-8");
    expect(source).not.toContain("isSqliteUniqueConstraintError");
  });
});
