import { describe, expect, test, vi } from "vitest";

import { orpc } from "../../../../rpc/query";
import {
  bookmarkListSearchIdentity,
  consumeBookmarkListScroll,
  rememberBookmarkListScroll,
} from "../list/bookmark-list-scroll-session";
import { resetBookmarkListCache } from "./reset-bookmark-list-cache";

describe(resetBookmarkListCache, () => {
  test("infinite list query を remove し、保存したスクロール位置を捨てる", () => {
    const removeQueries = vi.fn();
    rememberBookmarkListScroll(
      bookmarkListSearchIdentity({ tags: ["react"] }),
      480
    );
    const queryClient = { removeQueries } as never;

    resetBookmarkListCache(queryClient);

    expect(removeQueries).toHaveBeenCalledWith({
      queryKey: orpc.bookmarks.list.key({ type: "infinite" }),
    });
    expect(
      consumeBookmarkListScroll(bookmarkListSearchIdentity({ tags: ["react"] }))
    ).toBeNull();
  });
});
