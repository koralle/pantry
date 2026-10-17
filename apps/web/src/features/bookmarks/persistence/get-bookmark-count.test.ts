import * as v from "valibot";
import { afterEach, describe, expect, test } from "vitest";

import { userIdSchema } from "../../auth/domain/auth-values";
import { getBookmarkCount } from "./get-bookmark-count";
import {
  closeMemoryClients,
  createMemoryDb,
  insertBookmarkRow,
  insertBookmarkTagRow,
  insertTagRow,
  insertUser,
} from "./test-helpers";

afterEach(async () => {
  await closeMemoryClients();
});

const actorId = "user-a";
const otherId = "user-b";
const userId = v.parse(userIdSchema, actorId);
const deletedAt = new Date("2026-08-05T00:00:00.000Z");

describe(getBookmarkCount, () => {
  test("recent は未削除の自分の bookmark を数える", async () => {
    const db = await createMemoryDb();
    await insertUser(db, actorId);
    await insertUser(db, otherId);
    await insertBookmarkRow(db, {
      id: "a1",
      url: "https://example.com/a1",
      userId: actorId,
    });
    await insertBookmarkRow(db, {
      favorite: true,
      id: "a2",
      url: "https://example.com/a2",
      userId: actorId,
    });
    await insertBookmarkRow(db, {
      deletedAt,
      id: "a3",
      url: "https://example.com/a3",
      userId: actorId,
    });
    await insertBookmarkRow(db, {
      id: "b1",
      url: "https://example.com/b1",
      userId: otherId,
    });

    await expect(getBookmarkCount(db, userId, "recent")).resolves.toBe(2);
  });

  test("inbox はタグのない未削除の自分の bookmark を数える", async () => {
    const db = await createMemoryDb();
    await insertUser(db, actorId);
    await insertBookmarkRow(db, {
      id: "a1",
      url: "https://example.com/a1",
      userId: actorId,
    });
    await insertBookmarkRow(db, {
      id: "a2",
      url: "https://example.com/a2",
      userId: actorId,
    });
    await insertBookmarkRow(db, {
      deletedAt,
      id: "a3",
      url: "https://example.com/a3",
      userId: actorId,
    });
    const tag = await insertTagRow(db, actorId, "work");
    await insertBookmarkTagRow(db, "a2", tag);

    await expect(getBookmarkCount(db, userId, "inbox")).resolves.toBe(1);
  });

  test("favorites は favorite の未削除の自分の bookmark を数える", async () => {
    const db = await createMemoryDb();
    await insertUser(db, actorId);
    await insertBookmarkRow(db, {
      favorite: true,
      id: "a1",
      url: "https://example.com/a1",
      userId: actorId,
    });
    await insertBookmarkRow(db, {
      favorite: true,
      id: "a2",
      url: "https://example.com/a2",
      userId: actorId,
    });
    await insertBookmarkRow(db, {
      id: "a3",
      url: "https://example.com/a3",
      userId: actorId,
    });
    await insertBookmarkRow(db, {
      deletedAt,
      favorite: true,
      id: "a4",
      url: "https://example.com/a4",
      userId: actorId,
    });

    await expect(getBookmarkCount(db, userId, "favorites")).resolves.toBe(2);
  });

  test("該当なしは 0 を返す", async () => {
    const db = await createMemoryDb();
    await insertUser(db, actorId);

    await expect(getBookmarkCount(db, userId, "recent")).resolves.toBe(0);
    await expect(getBookmarkCount(db, userId, "inbox")).resolves.toBe(0);
    await expect(getBookmarkCount(db, userId, "favorites")).resolves.toBe(0);
  });
});
