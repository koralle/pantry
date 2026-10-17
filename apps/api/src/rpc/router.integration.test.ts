import { user as users } from "@pantry/db/schema/auth-schema";
import { describe, expect, it } from "vitest";

import {
  actor,
  createTestClient,
  other,
  withMigratedDb,
} from "../test/rpc-harness";

describe("router（本番 migration を適用した libSQL）", () => {
  const { getDb } = withMigratedDb();

  it("テストごとに actor と other だけが入った DB から始まる", async () => {
    const rows = await getDb()
      .select({ id: users.id })
      .from(users)
      .orderBy(users.id);

    expect(rows.map((row) => row.id)).toStrictEqual([actor.id, other.id]);
  });

  it("me は認証済みユーザーを返す", async () => {
    await expect(createTestClient(getDb(), actor).me()).resolves.toStrictEqual(
      actor
    );
  });

  it("未認証の me は defined な UNAUTHORIZED（401）を返す", async () => {
    await expect(createTestClient(getDb(), null).me()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      defined: true,
      status: 401,
    });
  });

  it("x-csrf-token の無い呼び出しは認証済みでも 403 で拒否する", async () => {
    await expect(
      createTestClient(getDb(), actor, { csrf: false }).me()
    ).rejects.toMatchObject({ code: "CSRF_TOKEN_MISMATCH", status: 403 });
  });
});
