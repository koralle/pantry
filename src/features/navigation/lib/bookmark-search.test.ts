import * as v from "valibot";
import { describe, expect, test } from "vitest";

import type { BookmarkDetailSearch } from "./bookmark-search";
import {
  bookmarkDetailSearchSchema,
  bookmarkSearchSchema,
} from "./bookmark-search";

describe("bookmarkSearchSchema", () => {
  test("default values", async () => {
    const result = await v.parseAsync(bookmarkSearchSchema, {});
    expect(result).toStrictEqual({});
  });

  test("unknown view falls back to recent", async () => {
    const result = await v.parseAsync(bookmarkSearchSchema, {
      view: "entrance",
    });
    expect(result).toStrictEqual({
      view: "recent",
    });
  });

  test("strips legacy limit and offset without error", async () => {
    const result = await v.parseAsync(bookmarkSearchSchema, {
      limit: 50,
      offset: 100,
      q: "react",
    });
    expect(result).toStrictEqual({
      q: "react",
    });
    expect(result).not.toHaveProperty("limit");
    expect(result).not.toHaveProperty("offset");
  });

  test("strips removed sort and tagMode without error", async () => {
    const result = await v.parseAsync(bookmarkSearchSchema, {
      sort: "updated",
      tagMode: "or",
    });
    expect(result).toStrictEqual({});
  });

  test("detail search keeps list conditions without filling defaults", async () => {
    const result = await v.parseAsync(bookmarkDetailSearchSchema, {
      q: "react",
    });
    expect(result).toStrictEqual({
      q: "react",
    });
  });

  test("parses all fields", async () => {
    const result = await v.parse(bookmarkSearchSchema, {
      q: "react",
      tags: ["frontend", "typescript"],
    });
    expect(result).toStrictEqual({
      q: "react",
      tags: ["frontend", "typescript"],
    });
  });

  test("BookmarkDetailSearch は schema の出力型である", () => {
    const parsed: BookmarkDetailSearch = v.parse(bookmarkDetailSearchSchema, {
      q: "react",
      tags: ["frontend"],
    });
    expect(parsed).toStrictEqual({
      q: "react",
      tags: ["frontend"],
    });
  });
});
