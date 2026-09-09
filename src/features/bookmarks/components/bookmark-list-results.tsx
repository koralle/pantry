import { ChevronDown } from "lucide-react";
import { css } from "styled-system/css";

import { StyledButton } from "../../../shared/components/styled-button";
import { StyledLink } from "../../../shared/components/styled-link";
import { UiEmpty } from "../../../shared/components/ui-empty";
import { UiError } from "../../../shared/components/ui-error";
import type { BookmarkSearchSchema } from "../../navigation/lib/bookmark-search";
import {
  buildListSearch,
  detailSearchFromList,
} from "../../navigation/lib/bookmark-search-builders";
import { useBookmarkListPagination } from "../hooks/use-bookmark-list-pagination";
import { BookmarkTable } from "./bookmark-table";

const partialSection = css({
  display: "flex",
  justifyContent: "center",
  marginBlockStart: "5",
});
const loadMoreButton = css({
  borderColor: "accent.solid",
  color: "accent.solid",
  fontWeight: "semibold",
  minInlineSize: "12rem",
});

const hasActiveConditions = (search: BookmarkSearchSchema): boolean =>
  Boolean(search.q?.trim()) ||
  (search.tags !== undefined && search.tags.length > 0);

export const BookmarkListResults = ({
  search,
}: {
  readonly search: BookmarkSearchSchema;
}) => {
  const { items, hasMore, loadMoreError, isLoadingMore, loadMore } =
    useBookmarkListPagination({
      search,
    });

  if (items.length === 0) {
    if (hasActiveConditions(search)) {
      const hasQ = Boolean(search.q?.trim());
      const hasTags = search.tags !== undefined && search.tags.length > 0;
      return (
        <UiEmpty
          title="条件に合うブックマークがありません"
          action={
            <StyledLink
              to="/"
              search={buildListSearch(search, {
                clearQ: hasQ,
                clearTags: hasTags,
              })}
              visual="accent"
            >
              条件をクリア
            </StyledLink>
          }
        />
      );
    }

    return (
      <UiEmpty
        title="まだブックマークがありません"
        action={
          <StyledLink
            to="/bookmarks/new"
            search={detailSearchFromList(search)}
            visual="accent"
          >
            新規
          </StyledLink>
        }
      />
    );
  }

  const detailSearch = detailSearchFromList(search);

  return (
    <div>
      <BookmarkTable bookmarks={items} detailSearch={detailSearch} />

      {hasMore ? (
        <div className={partialSection}>
          {loadMoreError === null || loadMoreError === undefined ? (
            <StyledButton
              className={loadMoreButton}
              isDisabled={isLoadingMore}
              onPress={loadMore}
            >
              <ChevronDown size={16} aria-hidden />{" "}
              {isLoadingMore ? "読み込み中…" : "さらに読み込む"}
            </StyledButton>
          ) : (
            <UiError message={loadMoreError} onRetry={loadMore} />
          )}
        </div>
      ) : null}
    </div>
  );
};
