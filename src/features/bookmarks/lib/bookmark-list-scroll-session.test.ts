import { afterEach, describe, expect, test } from "vitest";

import type { BookmarkSearchSchema } from "../../navigation/lib/bookmark-search";
import {
  bookmarkListSearchIdentity,
  clearBookmarkListScroll,
  consumeBookmarkListScroll,
  rememberBookmarkListScroll,
  shouldRestoreRouterScroll,
} from "./bookmark-list-scroll-session";

const defaultSearch = {
  sort: "newest",
  tagMode: "and",
} as const satisfies BookmarkSearchSchema;

describe("bookmark list scroll session", () => {
  afterEach(() => {
    clearBookmarkListScroll();
  });

  test("同じ一覧条件なら保存したスクロール位置を一度だけ返す", () => {
    rememberBookmarkListScroll(bookmarkListSearchIdentity(defaultSearch), 640);

    expect(
      consumeBookmarkListScroll(
        bookmarkListSearchIdentity({ ...defaultSearch })
      )
    ).toBe(640);
    expect(
      consumeBookmarkListScroll(
        bookmarkListSearchIdentity({ ...defaultSearch })
      )
    ).toBeNull();
  });

  test("条件が変わった一覧にはスクロール位置を渡さない", () => {
    rememberBookmarkListScroll(bookmarkListSearchIdentity(defaultSearch), 640);

    expect(
      consumeBookmarkListScroll(
        bookmarkListSearchIdentity({
          q: "react",
          sort: "newest",
          tagMode: "and",
        })
      )
    ).toBeNull();
  });

  test("タグ名のカンマとタグ配列の区切りを同一条件として扱わない", () => {
    const commaInName = bookmarkListSearchIdentity({
      sort: "newest",
      tagMode: "and",
      tags: ["a,b"],
    });
    const twoTags = bookmarkListSearchIdentity({
      sort: "newest",
      tagMode: "and",
      tags: ["a", "b"],
    });

    rememberBookmarkListScroll(commaInName, 640);

    expect(consumeBookmarkListScroll(twoTags)).toBeNull();
    expect(consumeBookmarkListScroll(commaInName)).toBe(640);
  });

  test("一覧 identity はタグ名のカンマと配列区切りを衝突させない", () => {
    expect(
      bookmarkListSearchIdentity({
        sort: "newest",
        tagMode: "and",
        tags: ["a,b"],
      })
    ).not.toBe(
      bookmarkListSearchIdentity({
        sort: "newest",
        tagMode: "and",
        tags: ["a", "b"],
      })
    );
  });

  test("タグ配列は要素と並びが同じときだけ同一条件", () => {
    expect(
      bookmarkListSearchIdentity({
        sort: "newest",
        tagMode: "and",
        tags: ["a", "b"],
      })
    ).toBe(
      bookmarkListSearchIdentity({
        sort: "newest",
        tagMode: "and",
        tags: ["a", "b"],
      })
    );
    expect(
      bookmarkListSearchIdentity({
        sort: "newest",
        tagMode: "and",
        tags: ["a", "b"],
      })
    ).not.toBe(
      bookmarkListSearchIdentity({
        sort: "newest",
        tagMode: "and",
        tags: ["b", "a"],
      })
    );
    expect(
      bookmarkListSearchIdentity({ sort: "newest", tagMode: "and" })
    ).not.toBe(
      bookmarkListSearchIdentity({ sort: "newest", tagMode: "and", tags: [] })
    );
  });

  test("ルーターの scroll restoration は一覧 pathname では動かさない", () => {
    expect(shouldRestoreRouterScroll({ pathname: "/bookmarks" })).toBeFalsy();
    expect(shouldRestoreRouterScroll({ pathname: "/bookmarks/" })).toBeFalsy();
    expect(shouldRestoreRouterScroll({ pathname: "/" })).toBeTruthy();
    expect(
      shouldRestoreRouterScroll({ pathname: "/bookmarks/new" })
    ).toBeTruthy();
    expect(shouldRestoreRouterScroll({ pathname: "/tags" })).toBeTruthy();
  });
});
