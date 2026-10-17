import { describe, expect, test } from "vitest";

import { selectTags } from "./select-tags";
import { createMemoryDb, parseUserId, seedTag, seedUser } from "./test-helpers";

describe(selectTags, () => {
  test("limit と offset を適用する", async () => {
    const db = await createMemoryDb();
    await seedUser(db, "user-a");
    await seedTag(db, { name: "alpha", userId: "user-a" });
    await seedTag(db, { name: "beta", userId: "user-a" });
    await seedTag(db, { name: "gamma", userId: "user-a" });

    const rows = await selectTags(db, parseUserId("user-a"), {
      limit: 2,
      offset: 1,
    });

    expect(rows.map((row) => row.name)).toStrictEqual(["beta", "gamma"]);
  });

  test("行は id と name だけの写像で、本人の行だけを返す", async () => {
    const db = await createMemoryDb();
    await seedUser(db, "user-a");
    await seedUser(db, "user-b");
    const alphaId = await seedTag(db, { name: "Alpha", userId: "user-a" });
    await seedTag(db, { name: "secret", userId: "user-b" });

    const rows = await selectTags(db, parseUserId("user-a"), {
      limit: 1000,
      offset: 0,
    });

    expect(rows).toStrictEqual([{ id: alphaId, name: "Alpha" }]);
  });
});
