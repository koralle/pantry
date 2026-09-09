import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useLayoutEffect } from "react";
import { getErrorMessage } from "react-error-boundary";

import type { BookmarkSearchSchema } from "../../navigation/lib/bookmark-search";
import {
  bookmarkListSearchIdentity,
  consumeBookmarkListScroll,
  rememberBookmarkListScroll,
} from "../lib/list/bookmark-list-scroll-session";
import { bookmarkListQueryOptions } from "../lib/queries/bookmark-list-query-options";

export const useBookmarkListPagination = ({
  search,
}: {
  readonly search: BookmarkSearchSchema;
}) => {
  const query = useSuspenseInfiniteQuery(bookmarkListQueryOptions(search));
  const items = query.data.pages.flatMap((page) => page.items);
  const searchIdentity = bookmarkListSearchIdentity(search);

  useLayoutEffect(() => {
    const scrollContainer = document.querySelector("#content");
    if (!scrollContainer) {
      return;
    }

    scrollContainer.scrollTop = consumeBookmarkListScroll(searchIdentity) ?? 0;

    return () => {
      rememberBookmarkListScroll(searchIdentity, scrollContainer.scrollTop);
    };
  }, [searchIdentity]);

  const loadMore = () => {
    if (query.isFetchingNextPage || !query.hasNextPage) {
      return;
    }
    void query.fetchNextPage();
  };

  return {
    hasMore: query.hasNextPage,
    isLoadingMore: query.isFetchingNextPage,
    items,
    loadMore,
    loadMoreError: query.isFetchNextPageError
      ? (getErrorMessage(query.error) ?? "続きの読み込みに失敗しました")
      : null,
  };
};
