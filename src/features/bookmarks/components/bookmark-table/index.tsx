import { DateFormatter, parseAbsolute } from "@internationalized/date";
import { Link } from "@tanstack/react-router";
import { css } from "styled-system/css";
import { flex, grid } from "styled-system/patterns";

import { tagChip } from "../../../../styles/tag-chip";
import type { BookmarkDetailSearch } from "../../../navigation/lib/bookmark-search";
import type { BookmarkListItem } from "../../persistence/list-bookmarks";

const EMPTY_DETAIL_SEARCH: BookmarkDetailSearch = {};

interface BookmarkTableProps {
  readonly bookmarks: BookmarkListItem[];
  readonly detailSearch?: BookmarkDetailSearch;
}

export const BookmarkTable = ({
  bookmarks,
  detailSearch = EMPTY_DETAIL_SEARCH,
}: BookmarkTableProps) => {
  const dateFormatter = new DateFormatter("ja-JP", {
    dateStyle: "long",
  });

  return (
    <div
      className={css({
        containerType: "inline-size",
      })}
    >
      <ul className={grid({ gap: 4 })}>
        {bookmarks.map((bookmark) => (
          <li key={bookmark.id}>
            <Link
              to="/bookmarks/$id"
              params={{ id: bookmark.id }}
              search={detailSearch}
              aria-labelledby={`bookmark-title-${bookmark.id}`}
              className={grid({
                gap: 2,
                padding: "clamp(8px, 5.3333px + 0.6667cqi, 16px)",
                color: "f.default",
                borderRadius: "box",
                borderColor: "border.default",
                borderStyle: "solid",
                borderWidth: "thin",
                "@media (any-hover: hover)": {
                  "&:hover": {
                    background: "accent.hover",
                    borderColor: "border.accent",
                  },
                },
                _focusVisible: {
                  background: "accent.hover",
                  borderColor: "border.accent",
                },
                transitionDuration: "hover",
                transitionProperty: "background-color, border-color",
                transitionTimingFunction: "press",
                cursor: "pointer",
              })}
            >
              <h2
                id={`bookmark-title-${bookmark.id}`}
                className={css({
                  fontSize: "clamp(1rem, calc(0.8333rem + 0.6667cqi), 1.5rem)",
                })}
              >
                {bookmark.title}
              </h2>

              <p>
                最終更新日：
                <time>
                  {dateFormatter.format(
                    parseAbsolute(bookmark.updatedAt, "Asia/Tokyo").toDate()
                  )}
                </time>
              </p>

              <ul className={flex({ gap: 2, flexWrap: "wrap" })}>
                {bookmark.tags.map((tag) => (
                  <li key={tag.id}>
                    <span className={tagChip({ visual: "label" })}>
                      {tag.name}
                    </span>
                  </li>
                ))}
              </ul>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
