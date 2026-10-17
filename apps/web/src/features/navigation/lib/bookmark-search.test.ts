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

  test("strips removed search params without error", async () => {
    const result = await v.parseAsync(bookmarkSearchSchema, {
      limit: 50,
      offset: 100,
      q: "react",
    });
    expect(result).toStrictEqual({});
    expect(result).not.toHaveProperty("limit");
    expect(result).not.toHaveProperty("offset");
    expect(result).not.toHaveProperty("q");
  });

  test("strips removed sort and tagMode without error", async () => {
    const result = await v.parseAsync(bookmarkSearchSchema, {
      sort: "updated",
      tagMode: "or",
    });
    expect(result).toStrictEqual({});
  });

  test("detail search keeps list conditions without filling defaults", () => {
    const result = v.parse(bookmarkDetailSearchSchema, {
      tags: ["frontend"],
    });
    expect(result).toStrictEqual({
      tags: ["frontend"],
    });
  });

  test("parses all fields", () => {
    const result = v.parse(bookmarkSearchSchema, {
      layout: "cards",
      tags: ["frontend", "typescript"],
      view: "favorites",
    });
    expect(result).toStrictEqual({
      layout: "cards",
      tags: ["frontend", "typescript"],
      view: "favorites",
    });
  });

  test("BookmarkDetailSearch は schema の出力型である", () => {
    const parsed: BookmarkDetailSearch = v.parse(bookmarkDetailSearchSchema, {
      tags: ["frontend"],
    });
    expect(parsed).toStrictEqual({
      tags: ["frontend"],
    });
  });
});
