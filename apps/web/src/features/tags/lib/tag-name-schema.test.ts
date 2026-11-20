import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { tagNameSchema } from "./tag-name-schema";

describe("tagNameSchema の parse", () => {
  test("returns display and normalized from mixed-case input", () => {
    expect(v.parse(tagNameSchema, "  TypeScript  ")).toStrictEqual({
      display: "TypeScript",
      normalized: "typescript",
    });
  });

  test("accepts a 32-character display name", () => {
    const name = "A".repeat(32);
    expect(v.parse(tagNameSchema, name)).toStrictEqual({
      display: name,
      normalized: "a".repeat(32),
    });
  });

  test("rejects an empty string after trimming", () => {
    expect(() => v.parse(tagNameSchema, "   ")).toThrow(
      /タグ名を入力してください/u
    );
  });

  test("rejects a name longer than 32 characters", () => {
    expect(() => v.parse(tagNameSchema, "a".repeat(33))).toThrow(
      /タグ名は32文字以内/u
    );
  });
});
