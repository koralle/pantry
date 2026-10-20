import { user as users } from "@pantry/db/schema/auth-schema";
import { describe, expect, test } from "vitest";

import {
  actor,
  createTestClient,
  other,
  withMigratedDb,
} from "../test/rpc-harness";

describe("router（本番 migration を適用した libSQL）", () => {
  const { getDb } = withMigratedDb();

  test("テストごとに actor と other だけが入った DB から始まる", async () => {
    const rows = await getDb()
      .select({ id: users.id })
      .from(users)
      .orderBy(users.id);

    expect(rows.map((row) => row.id)).toStrictEqual([actor.id, other.id]);
  });

  test("me は認証済みユーザーを返す", async () => {
    await expect(createTestClient(getDb(), actor).me()).resolves.toStrictEqual(
      actor
    );
  });

  test("未認証の me は defined な UNAUTHORIZED（401）を返す", async () => {
    await expect(createTestClient(getDb(), null).me()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      defined: true,
      status: 401,
    });
  });

  test("x-csrf-token を付けない旧 web の client でも health / me を使える", async () => {
    const client = createTestClient(getDb(), actor);

    await expect(client.health()).resolves.toStrictEqual({ status: "ok" });
    await expect(client.me()).resolves.toStrictEqual(actor);
  });
});
