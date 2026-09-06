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
    expect(result).toStrictEqual({
      sort: "newest",
      tagMode: "and",
    });
  });

  test("ignores legacy view query and lands on list defaults", async () => {
    const result = await v.parseAsync(bookmarkSearchSchema, {
      view: "entrance",
    });
    expect(result).toStrictEqual({
      sort: "newest",
      tagMode: "and",
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
      sort: "newest",
      tagMode: "and",
    });
    expect(result).not.toHaveProperty("limit");
    expect(result).not.toHaveProperty("offset");
  });

  test("detail search keeps list conditions without filling defaults", async () => {
    const result = await v.parseAsync(bookmarkDetailSearchSchema, {
      q: "react",
      sort: "updated",
      tagMode: "or",
    });
    expect(result).toStrictEqual({
      q: "react",
      sort: "updated",
      tagMode: "or",
    });
  });

  test("parses all fields", async () => {
    const result = await v.parse(bookmarkSearchSchema, {
      q: "react",
      sort: "updated",
      tagMode: "or",
      tags: ["frontend", "typescript"],
    });
    expect(result).toStrictEqual({
      q: "react",
      sort: "updated",
      tagMode: "or",
      tags: ["frontend", "typescript"],
    });
  });

  test("rejects invalid tagMode", async () => {
    await expect(
      v.parseAsync(bookmarkSearchSchema, { tagMode: "xor" })
    ).rejects.toThrow();
  });

  test("rejects invalid sort", async () => {
    await expect(
      v.parseAsync(bookmarkSearchSchema, { sort: "oldest" })
    ).rejects.toThrow();
  });

  test("BookmarkDetailSearch は schema の出力型である", () => {
    const parsed: BookmarkDetailSearch = v.parse(bookmarkDetailSearchSchema, {
      q: "react",
      sort: "updated",
      tagMode: "or",
      tags: ["frontend"],
    });
    expect(parsed).toStrictEqual({
      q: "react",
      sort: "updated",
      tagMode: "or",
      tags: ["frontend"],
    });
  });
});
