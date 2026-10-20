import { describe, expect, test } from "vitest";

import {
  createMemoryDb,
  parseUserId,
  seedTag,
  seedUser,
} from "../test-helpers";
import { selectTagById } from "./index";

describe(selectTagById, () => {
  test("本人のタグなら画面 projection を返す", async () => {
    const db = await createMemoryDb();
    await seedUser(db, "user-a");
    const id = await seedTag(db, {
      color: "#c45c26",
      name: "reading",
      pinned: true,
      sortOrder: 2,
      userId: "user-a",
    });

    const record = await selectTagById(db, parseUserId("user-a"), id);

    expect(record).toStrictEqual({
      color: "#c45c26",
      id,
      name: "reading",
      pinned: true,
      sortOrder: 2,
    });
  });

  test("他人のタグは null を返す", async () => {
    const db = await createMemoryDb();
    await seedUser(db, "user-a");
    await seedUser(db, "user-b");
    const id = await seedTag(db, { name: "secret", userId: "user-b" });

    await expect(
      selectTagById(db, parseUserId("user-a"), id)
    ).resolves.toBeNull();
  });

  test("存在しない id は null を返す", async () => {
    const db = await createMemoryDb();
    await seedUser(db, "user-a");

    await expect(
      selectTagById(db, parseUserId("user-a"), 999)
    ).resolves.toBeNull();
  });
});
