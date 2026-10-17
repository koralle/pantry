import * as v from "valibot";
import { describe, expect, it } from "vitest";

import { offsetPaginationQuerySchema } from "./schemas/pagination";
import { updateTagInputSchema } from "./schemas/tag-procedures";
import { tagsContract } from "./tags";

describe("tagsContract", () => {
  it("web の /api/rpc と同じ procedure を公開する", () => {
    expect(Object.keys(tagsContract).toSorted()).toStrictEqual([
      "byId",
      "create",
      "delete",
      "list",
      "shelf",
      "touch",
      "update",
    ]);
  });

  it("どの procedure も UNAUTHORIZED（401）を宣言する", () => {
    for (const procedure of Object.values(tagsContract)) {
      expect(procedure["~orpc"].errorMap).toMatchObject({
        UNAUTHORIZED: { status: 401 },
      });
    }
  });

  it("画面が分岐する業務エラーの status を web と揃える", () => {
    expect(tagsContract.create["~orpc"].errorMap).toMatchObject({
      "tag-name-already-exists": { status: 409 },
    });
    expect(tagsContract.update["~orpc"].errorMap).toMatchObject({
      "tag-name-already-exists": { status: 409 },
      "tag-not-found": { status: 404 },
    });
    for (const name of ["byId", "delete", "touch"] as const) {
      expect(tagsContract[name]["~orpc"].errorMap).toMatchObject({
        "tag-not-found": { status: 404 },
      });
    }
  });
});

describe("updateTagInputSchema", () => {
  const valid = {
    color: "#abc",
    id: 1,
    name: "Work",
    pinned: false,
    sortOrder: -1.5,
  };

  it("#RGB / #RRGGBB / null の色と、負数や小数の sortOrder を受ける", () => {
    expect(v.safeParse(updateTagInputSchema, valid).success).toBe(true);
    expect(
      v.safeParse(updateTagInputSchema, { ...valid, color: "#AABBCC" }).success
    ).toBe(true);
    expect(
      v.safeParse(updateTagInputSchema, { ...valid, color: null }).success
    ).toBe(true);
  });

  it("色の書式違いと欠けた項目は拒否する", () => {
    expect(
      v.safeParse(updateTagInputSchema, { ...valid, color: "red" }).success
    ).toBe(false);
    const { pinned: _pinned, ...withoutPinned } = valid;
    expect(v.safeParse(updateTagInputSchema, withoutPinned).success).toBe(
      false
    );
  });
});

describe("offsetPaginationQuerySchema", () => {
  it("省略は limit 50 / offset 0、文字列の数値も受ける", () => {
    expect(v.parse(offsetPaginationQuerySchema, {})).toStrictEqual({
      limit: 50,
      offset: 0,
    });
    expect(
      v.parse(offsetPaginationQuerySchema, { limit: "10", offset: "5" })
    ).toStrictEqual({ limit: 10, offset: 5 });
  });

  it("50 を超える limit を拒否する", () => {
    expect(
      v.safeParse(offsetPaginationQuerySchema, { limit: 51 }).success
    ).toBe(false);
  });
});
