import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { userIdSchema } from "../../../../domain/user-id";
import {
  attachTag,
  seedBookmark,
  seedTag,
  seedUser,
  withPersistenceDb,
} from "../../../../test/db/migrated-db";
import { getBookmarkDetail } from "./index";

const persistence = withPersistenceDb();

const createdAt = new Date("2026-08-01T00:00:00.000Z");
const updatedAt = new Date("2026-08-02T00:00:00.000Z");

function actor(userId: string) {
  return v.parse(userIdSchema, userId);
}

describe(getBookmarkDetail, () => {
  test("自分の未削除ブックマークを tagNames 付きで返す", async () => {
    const db = persistence.getDb();
    await seedUser(db, "user-a");
    await seedTag(db, { name: "work", userId: "user-a" });
    const readingId = await seedTag(db, {
      name: "reading",
      userId: "user-a",
    });
    await seedBookmark(db, {
      createdAt,
      id: "b-1",
      note: "メモ",
      title: "詳細",
      updatedAt,
      userId: "user-a",
    });
    await attachTag(db, "b-1", readingId);

    const detail = await getBookmarkDetail(db, actor("user-a"), { id: "b-1" });

    expect(detail).toStrictEqual({
      createdAt: new Date("2026-08-01T00:00:00.000Z").toISOString(),
      favorite: false,
      id: "b-1",
      note: "メモ",
      tagNames: ["reading"],
      title: "詳細",
      updatedAt: new Date("2026-08-02T00:00:00.000Z").toISOString(),
      url: "https://example.com/b-1",
    });
  });

  test("tagNames はタグ名の昇順で返す", async () => {
    const db = persistence.getDb();
    await seedUser(db, "user-a");
    const workId = await seedTag(db, { name: "work", userId: "user-a" });
    const readingId = await seedTag(db, {
      name: "reading",
      userId: "user-a",
    });
    await seedBookmark(db, { id: "b-1", userId: "user-a" });
    await attachTag(db, "b-1", workId);
    await attachTag(db, "b-1", readingId);

    const detail = await getBookmarkDetail(db, actor("user-a"), { id: "b-1" });

    expect(detail?.tagNames).toStrictEqual(["reading", "work"]);
  });

  test("他人のブックマークは null を返す", async () => {
    const db = persistence.getDb();
    await seedUser(db, "user-a");
    await seedUser(db, "user-b");
    await seedBookmark(db, { id: "b-1", userId: "user-a" });

    const detail = await getBookmarkDetail(db, actor("user-b"), { id: "b-1" });

    expect(detail).toBeNull();
  });

  test("削除済みブックマークは null を返す", async () => {
    const db = persistence.getDb();
    await seedUser(db, "user-a");
    await seedBookmark(db, {
      deletedAt: new Date("2026-08-03T00:00:00.000Z"),
      id: "b-1",
      userId: "user-a",
    });

    const detail = await getBookmarkDetail(db, actor("user-a"), { id: "b-1" });

    expect(detail).toBeNull();
  });

  test("存在しない id は null を返す", async () => {
    const db = persistence.getDb();
    await seedUser(db, "user-a");

    const detail = await getBookmarkDetail(db, actor("user-a"), {
      id: "missing",
    });

    expect(detail).toBeNull();
  });
});
