import { Link } from "@tanstack/react-router";
import { css, cx } from "styled-system/css";

import { interactiveSurface, surface } from "../../../styles/surface";
import { tagChip } from "../../../styles/tag-chip";
import type { BookmarkDetailSearch } from "../../navigation/lib/bookmark-search";
import { shortenUrl } from "../lib/shorten-url";
import type { BookmarkListItem } from "../persistence/list-bookmarks";

export const bookmarkCards = css({
  alignItems: "stretch",
  display: "grid",
  gap: "4",
  gridTemplateColumns: "minmax(0, 1fr)",
  listStyle: "none",
  margin: "0",
  padding: "0",
  sm: { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
});
const cardItem = css({
  blockSize: "full",
  display: "flex",
  minInlineSize: "0",
});
const bookmarkCard = css({
  _focusVisible: {
    outlineColor: "accent.solid",
    outlineOffset: "-2px",
    outlineStyle: "solid",
    outlineWidth: "medium",
  },
  color: "fg.default",
  display: "flex",
  flex: "1",
  flexDirection: "column",
  gap: "1.5",
  inlineSize: "full",
  minBlockSize: "5.5rem",
  minInlineSize: "0",
  paddingBlock: "4",
  paddingInline: "4.5",
  textDecoration: "none",
});
const cardTitle = css({
  fontWeight: "bold",
  minInlineSize: "0",
  overflowWrap: "anywhere",
});
const cardUrl = css({
  color: "fg.muted",
  fontSize: "xs",
  minInlineSize: "0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});
const cardNote = css({
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: "2",
  color: "fg.muted",
  display: "-webkit-box",
  fontSize: "xs",
  minInlineSize: "0",
  overflow: "hidden",
} as never);
const bookmarkTags = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "1",
  listStyle: "none",
  margin: "0",
  padding: "0",
});
const cardTags = cx(bookmarkTags, css({ marginBlockStart: "auto" }));

export const BookmarkCardList = ({
  bookmarks,
  detailSearch,
}: {
  readonly bookmarks: BookmarkListItem[];
  readonly detailSearch: BookmarkDetailSearch;
}) => (
  <ul className={bookmarkCards}>
    {bookmarks.map((bookmark) => (
      <li key={bookmark.id} className={cardItem}>
        <Link
          to="/bookmarks/$id"
          params={{ id: bookmark.id }}
          search={detailSearch}
          className={cx(surface, interactiveSurface, bookmarkCard)}
        >
          <span className={cardTitle}>{bookmark.title}</span>
          <span className={cardUrl}>{shortenUrl(bookmark.url)}</span>
          {bookmark.note ? (
            <span className={cardNote}>{bookmark.note}</span>
          ) : null}
          {bookmark.tags.length > 0 ? (
            <div className={cardTags}>
              {bookmark.tags.map((tag) => (
                <span key={tag.id} className={tagChip({ visual: "label" })}>
                  {tag.name}
                </span>
              ))}
            </div>
          ) : null}
        </Link>
      </li>
    ))}
  </ul>
);
