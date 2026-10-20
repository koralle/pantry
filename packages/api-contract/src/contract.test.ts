import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { contract } from "./contract";
import { sessionUserSchema } from "./schemas/session-user";

describe("contract", () => {
  test("health / me と機能ごとの namespace を公開する", () => {
    expect(Object.keys(contract)).toStrictEqual([
      "bookmarks",
      "health",
      "me",
      "tags",
    ]);
  });

  test("health は ok の output schema を持つ", () => {
    expect(contract.health["~orpc"].outputSchema).toBeDefined();
  });

  test("me は UNAUTHORIZED を 401 として宣言する", () => {
    expect(contract.me["~orpc"].errorMap).toStrictEqual({
      UNAUTHORIZED: { status: 401 },
    });
  });
});

describe("sessionUserSchema", () => {
  test("email / id / name だけを残す", () => {
    const result = v.safeParse(sessionUserSchema, {
      email: "koralle@example.com",
      id: "user_1",
      name: "koralle",
      role: "admin",
    });

    expect(result.success ? result.output : null).toStrictEqual({
      email: "koralle@example.com",
      id: "user_1",
      name: "koralle",
    });
  });

  test("name が無ければ失敗する", () => {
    expect(
      v.safeParse(sessionUserSchema, { email: "a@example.com" }).success
    ).toBe(false);
  });
});
