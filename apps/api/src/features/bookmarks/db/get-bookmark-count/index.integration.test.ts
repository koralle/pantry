import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { userIdSchema } from "../../../../domain/user-id";
import {
  attachTag,
  seedBookmark,
  seedTag,
  seedUser,
  withTestDb,
} from "../../../../test/db/migrated-db";
import { getBookmarkCount } from "./index";

const testDb = withTestDb();

const actorId = "user-a";
const otherId = "user-b";
const userId = v.parse(userIdSchema, actorId);
const deletedAt = new Date("2026-08-05T00:00:00.000Z");

describe(getBookmarkCount, () => {
  test("recent は未削除の自分の bookmark を数える", async () => {
    const db = testDb.getDb();
    await seedUser(db, actorId);
    await seedUser(db, otherId);
    await seedBookmark(db, {
      id: "a1",
      url: "https://example.com/a1",
      userId: actorId,
    });
    await seedBookmark(db, {
      favorite: true,
      id: "a2",
      url: "https://example.com/a2",
      userId: actorId,
    });
    await seedBookmark(db, {
      deletedAt,
      id: "a3",
      url: "https://example.com/a3",
      userId: actorId,
    });
    await seedBookmark(db, {
      id: "b1",
      url: "https://example.com/b1",
      userId: otherId,
    });

    await expect(getBookmarkCount(db, userId, "recent")).resolves.toBe(2);
  });

  test("inbox はタグのない未削除の自分の bookmark を数える", async () => {
    const db = testDb.getDb();
    await seedUser(db, actorId);
    await seedBookmark(db, {
      id: "a1",
      url: "https://example.com/a1",
      userId: actorId,
    });
    await seedBookmark(db, {
      id: "a2",
      url: "https://example.com/a2",
      userId: actorId,
    });
    await seedBookmark(db, {
      deletedAt,
      id: "a3",
      url: "https://example.com/a3",
      userId: actorId,
    });
    const tag = await seedTag(db, { name: "work", userId: actorId });
    await attachTag(db, "a2", tag);

    await expect(getBookmarkCount(db, userId, "inbox")).resolves.toBe(1);
  });

  test("favorites は favorite の未削除の自分の bookmark を数える", async () => {
    const db = testDb.getDb();
    await seedUser(db, actorId);
    await seedBookmark(db, {
      favorite: true,
      id: "a1",
      url: "https://example.com/a1",
      userId: actorId,
    });
    await seedBookmark(db, {
      favorite: true,
      id: "a2",
      url: "https://example.com/a2",
      userId: actorId,
    });
    await seedBookmark(db, {
      id: "a3",
      url: "https://example.com/a3",
      userId: actorId,
    });
    await seedBookmark(db, {
      deletedAt,
      favorite: true,
      id: "a4",
      url: "https://example.com/a4",
      userId: actorId,
    });

    await expect(getBookmarkCount(db, userId, "favorites")).resolves.toBe(2);
  });

  test("該当なしは 0 を返す", async () => {
    const db = testDb.getDb();
    await seedUser(db, actorId);

    await expect(getBookmarkCount(db, userId, "recent")).resolves.toBe(0);
    await expect(getBookmarkCount(db, userId, "inbox")).resolves.toBe(0);
    await expect(getBookmarkCount(db, userId, "favorites")).resolves.toBe(0);
  });
});
