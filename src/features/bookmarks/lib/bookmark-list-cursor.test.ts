import { describe, expect, test } from "vitest";

import {
  decodeBookmarkListCursor,
  encodeBookmarkListCursor,
} from "./bookmark-list-cursor";

describe("bookmark list cursor", () => {
  test("sort 値と Bookmark ID を往復できる", () => {
    const encoded = encodeBookmarkListCursor({
      id: "019fae92-3bb0-78cd-b488-65ce0e26a001",
      sortValueMs: 1_775_001_600_000,
    });

    expect(decodeBookmarkListCursor(encoded)).toStrictEqual({
      id: "019fae92-3bb0-78cd-b488-65ce0e26a001",
      sortValueMs: 1_775_001_600_000,
    });
  });

  test("不正なカーソルは null を返し、例外を投げない", () => {
    expect(decodeBookmarkListCursor("")).toBeNull();
    expect(decodeBookmarkListCursor("not-a-cursor")).toBeNull();
    expect(decodeBookmarkListCursor("abc:id")).toBeNull();
    expect(decodeBookmarkListCursor("123:")).toBeNull();
    expect(decodeBookmarkListCursor("1.5:id")).toBeNull();
  });

  test("Date として無効な sort 値は null を返す", () => {
    expect(
      decodeBookmarkListCursor(
        `${Number.MAX_SAFE_INTEGER}:019fae92-3bb0-78cd-b488-65ce0e26a001`
      )
    ).toBeNull();
  });

  test("Bookmark ID 形式でない id は null を返す", () => {
    expect(decodeBookmarkListCursor("1775001600000:not-a-uuid")).toBeNull();
    expect(
      decodeBookmarkListCursor(
        "1775001600000:019fae92-3bb0-48cd-b488-65ce0e26a001"
      )
    ).toBeNull();
  });
});
