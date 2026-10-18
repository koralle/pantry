import * as v from "valibot";
import { describe, expect, test } from "vitest";

import {
  tagIdSchema,
  tagNameSchema,
  tagNamesMatch,
  toTagName,
  uniqueNormalizedTagNames,
} from "./tag-values";

describe("tagIdSchema", () => {
  test("accepts positive integers", () => {
    const result = v.safeParse(tagIdSchema, 1);
    expect(result.success).toBeTruthy();
    if (result.success) {
      expect(result.output).toBe(1);
    }
  });

  test("rejects zero and negative numbers", () => {
    expect(v.safeParse(tagIdSchema, 0).success).toBeFalsy();
    expect(v.safeParse(tagIdSchema, -1).success).toBeFalsy();
  });
});

describe(toTagName, () => {
  test("trims, keeps display case, and derives normalized", () => {
    expect(toTagName("  TypeScript  ")).toStrictEqual({
      display: "TypeScript",
      normalized: "typescript",
    });
  });

  test("composes Unicode to NFC so decomposed kana match composed kana", () => {
    const decomposed = "ハ\u309A";
    const composed = "パ";
    expect(toTagName(decomposed)).toStrictEqual(toTagName(composed));
  });

  test("does not treat fullwidth Latin as the same name", () => {
    expect(toTagName("Ｒｅａｃｔ").normalized).not.toBe(
      toTagName("React").normalized
    );
  });
});

describe(uniqueNormalizedTagNames, () => {
  test("dedupes mixed-case and composed Unicode names", () => {
    expect(
      uniqueNormalizedTagNames([" React ", "react", "ハ\u309A", "パ", "  "])
    ).toStrictEqual(["react", "パ"]);
  });
});

describe(tagNamesMatch, () => {
  test("treats case and composition as the same name", () => {
    expect(tagNamesMatch("TypeScript", " typescript ")).toBeTruthy();
    expect(tagNamesMatch("ハ\u309A", "パ")).toBeTruthy();
    expect(tagNamesMatch("React", "Vue")).toBeFalsy();
  });
});

describe("tagNameSchema", () => {
  test("returns display and normalized from mixed-case input", () => {
    const result = v.safeParse(tagNameSchema, "  TypeScript  ");
    expect(result.success).toBeTruthy();
    if (result.success) {
      expect(result.output).toStrictEqual({
        display: "TypeScript",
        normalized: "typescript",
      });
    }
  });

  test("accepts a 32-character display name", () => {
    const name = "A".repeat(32);
    const result = v.safeParse(tagNameSchema, name);
    expect(result.success).toBeTruthy();
    if (result.success) {
      expect(result.output.display).toBe(name);
      expect(result.output.normalized).toBe("a".repeat(32));
    }
  });

  test("rejects empty string after trimming", () => {
    expect(v.safeParse(tagNameSchema, "   ").success).toBeFalsy();
  });

  test("rejects a display name longer than 32 characters", () => {
    expect(v.safeParse(tagNameSchema, "a".repeat(33)).success).toBeFalsy();
  });
});
