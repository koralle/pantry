import { useQuery } from "@tanstack/react-query";
import { ChevronDown, RotateCw } from "lucide-react";
import { css } from "styled-system/css";

import { orpc } from "../../../rpc/query";
import { button } from "../../../styles/button";
import type { BookmarkSearchSchema } from "../../navigation/lib/bookmark-search";
import {
  buildListSearch,
  detailSearchFromList,
} from "../../navigation/lib/bookmark-search-builders";
import { useBookmarkListPagination } from "../hooks/use-bookmark-list-pagination";
import { domainOf } from "../lib/domain-of";
import { formatRelativeTime } from "../lib/format/format-relative-time";
import type { BookmarkListItem } from "../persistence/list-bookmarks";
import { BookmarkListContent } from "./bookmark-list";
import type { BookmarkRowProps } from "./bookmark-row";

const loadMoreSection = css({
  display: "flex",
  justifyContent: "center",
  marginBlockStart: "5",
});

const loadMoreErrorNote = css({
  alignItems: "center",
  color: "danger.solid",
  columnGap: "2",
  display: "flex",
  fontSize: "xs",
  justifyContent: "center",
  marginBlockStart: "3",
});

const hasActiveConditions = (search: BookmarkSearchSchema): boolean =>
  Boolean(search.q?.trim()) ||
  (search.tags !== undefined && search.tags.length > 0);

export const bookmarkListTitle = (search: BookmarkSearchSchema): string => {
  const q = search.q?.trim();
  if (q !== undefined && q !== "") {
    return `「${q}」の検索結果`;
  }
  const tags = search.tags;
  if (tags !== undefined && tags.length > 0) {
    return tags.join(" / ");
  }
  if (search.view === "inbox") {
    return "未整理";
  }
  if (search.view === "favorites") {
    return "お気に入り";
  }
  return "最近保存したもの";
};

const countForView = (
  search: BookmarkSearchSchema,
  counts: { favorites: number; inbox: number; recent: number } | undefined
): number | undefined => {
  if (search.view === "inbox") {
    return counts?.inbox;
  }
  if (search.view === "favorites") {
    return counts?.favorites;
  }
  return counts?.recent;
};

const isRecentView = (search: BookmarkSearchSchema): boolean =>
  search.view === undefined || search.view === "recent";

const toRowProps = (item: BookmarkListItem): BookmarkRowProps => ({
  dateLabel: formatRelativeTime(item.createdAt),
  domain: domainOf(item.url),
  id: item.id,
  starred: item.favorite,
  tags: item.tags.map((tag) => ({ color: tag.color, name: tag.name })),
  title: item.title,
});

export const BookmarkListResults = ({
  search,
}: {
  readonly search: BookmarkSearchSchema;
}) => {
  const { items, hasMore, loadMoreError, isLoadingMore, loadMore } =
    useBookmarkListPagination({
      search,
    });
  const countsQuery = useQuery(
    orpc.bookmarks.counts.queryOptions({ staleTime: 5000 })
  );

  const title = bookmarkListTitle(search);
  const filtered = hasActiveConditions(search);
  const detailSearch = detailSearchFromList(search);

  if (items.length === 0) {
    return (
      <BookmarkListContent
        clearSearch={
          filtered
            ? buildListSearch(search, {
                clearQ: Boolean(search.q?.trim()),
                clearTags: search.tags !== undefined && search.tags.length > 0,
              })
            : undefined
        }
        emptyVariant={filtered ? "filtered" : "blank"}
        newSearch={detailSearch}
        state="empty"
        title={title}
      />
    );
  }

  const counts = countsQuery.data;
  const viewCount = filtered ? undefined : countForView(search, counts);
  const inboxCount =
    filtered || !isRecentView(search) ? undefined : counts?.inbox;

  return (
    <>
      <BookmarkListContent
        count={viewCount}
        inboxCount={inboxCount}
        items={items.map(toRowProps)}
        newSearch={detailSearch}
        state="ideal"
        title={title}
      />

      {hasMore ? (
        <div className={loadMoreSection}>
          <button
            className={button({ size: "sm" })}
            disabled={isLoadingMore}
            onClick={loadMore}
            type="button"
          >
            <ChevronDown aria-hidden size={13} />
            {isLoadingMore ? "読み込み中…" : "もっと見る"}
          </button>
        </div>
      ) : null}
      {loadMoreError === null ? null : (
        <p className={loadMoreErrorNote} role="alert">
          {loadMoreError}
          <button
            className={css({
              color: "accent.solid",
              fontWeight: "semibold",
            })}
            onClick={loadMore}
            type="button"
          >
            <RotateCw aria-hidden size={12} />
            再試行
          </button>
        </p>
      )}
    </>
  );
};
