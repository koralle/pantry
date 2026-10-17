import { describe, expect, test } from "vitest";

import { selectShelfTags } from "./select-shelf-tags";
import {
  createMemoryDb,
  parseUserId,
  seedBookmark,
  seedTag,
  seedUser,
} from "./test-helpers";

describe(selectShelfTags, () => {
  test("本人のタグだけを bookmarkCount 付きで返す", async () => {
    const db = await createMemoryDb();
    await seedUser(db, "user-a");
    await seedUser(db, "user-b");
    const workId = await seedTag(db, {
      color: "#2f6fed",
      name: "work",
      pinned: true,
      userId: "user-a",
    });
    const privateId = await seedTag(db, { name: "private", userId: "user-b" });
    const inboxId = await seedTag(db, { name: "inbox", userId: "user-a" });
    await seedBookmark(db, { id: "bm-1", tagIds: [workId], userId: "user-a" });
    await seedBookmark(db, {
      id: "bm-2",
      tagIds: [privateId],
      userId: "user-b",
    });

    const rows = await selectShelfTags(db, parseUserId("user-a"));

    expect(rows).toHaveLength(2);
    const byName = new Map(rows.map((row) => [row.name, row]));
    expect(byName.get("work")).toStrictEqual({
      bookmarkCount: 1,
      color: "#2f6fed",
      id: workId,
      lastUsedAt: null,
      name: "work",
      pinned: true,
      sortOrder: 0,
    });
    expect(byName.get("inbox")).toMatchObject({
      bookmarkCount: 0,
      id: inboxId,
    });
  });

  test("他ユーザーのブックマークは bookmarkCount に含めない", async () => {
    const db = await createMemoryDb();
    await seedUser(db, "user-a");
    await seedUser(db, "user-b");
    const workId = await seedTag(db, { name: "work", userId: "user-a" });
    await seedBookmark(db, { id: "bm-a", tagIds: [workId], userId: "user-a" });
    await seedBookmark(db, { id: "bm-b", tagIds: [workId], userId: "user-b" });

    const rows = await selectShelfTags(db, parseUserId("user-a"));

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ bookmarkCount: 1, id: workId });
  });

  test("削除済みブックマークは bookmarkCount に含めない", async () => {
    const db = await createMemoryDb();
    await seedUser(db, "user-a");
    const readingId = await seedTag(db, { name: "reading", userId: "user-a" });
    await seedBookmark(db, {
      id: "bm-live",
      tagIds: [readingId],
      userId: "user-a",
    });
    await seedBookmark(db, {
      deleted: true,
      id: "bm-dead",
      tagIds: [readingId],
      userId: "user-a",
    });

    const rows = await selectShelfTags(db, parseUserId("user-a"));

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ bookmarkCount: 1, id: readingId });
  });

  test("lastUsedAt を Date として返す", async () => {
    const db = await createMemoryDb();
    await seedUser(db, "user-a");
    const lastUsedAt = new Date("2026-08-01T00:00:00.000Z");
    await seedTag(db, { lastUsedAt, name: "recent", userId: "user-a" });

    const rows = await selectShelfTags(db, parseUserId("user-a"));

    expect(rows[0]?.lastUsedAt).toStrictEqual(lastUsedAt);
  });
});
