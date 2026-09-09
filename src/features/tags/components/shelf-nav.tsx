import { Link } from "@tanstack/react-router";
import { css, cx } from "styled-system/css";

import { metaCount } from "../../../styles/type";
import type { BookmarkSearchSchema } from "../../navigation/lib/bookmark-search";
import {
  allShelfSearch,
  tagShelfSearch,
} from "../../navigation/lib/bookmark-search-builders";
import { tagNamesMatch } from "../domain/tag-values";
import { sortTagsForNav } from "../lib/tag-shelf";
import type { ShelfTag } from "../lib/tag-shelf";

const shelfNav = css({
  display: "flex",
  flexDirection: "column",
  gap: "0.5",
});

const shelfItem = css({
  '&[data-selected="true"]': {
    background: "accent.subtle",
    borderInlineStartColor: "accent.solid",
  },
  "@media (any-hover: hover)": {
    '&:hover:not([data-selected="true"])': {
      background: "accent.hover",
    },
  },
  alignItems: "center",
  borderInlineStartColor: "transparent",
  borderInlineStartStyle: "solid",
  borderInlineStartWidth: "thick",
  borderRadius: "box",
  color: "fg.default",
  display: "flex",
  gap: "2",
  minBlockSize: "touch",
  paddingBlock: "2.5",
  paddingInline: "3.5",
  textDecoration: "none",
  transitionDuration: "hover",
  transitionProperty: "background-color, border-color",
  transitionTimingFunction: "press",
});

const shelfItemLabel = css({
  flex: "1",
  fontWeight: "semibold",
  minInlineSize: "0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

const shelfItemCount = metaCount;

const shelfDot = css({
  background: "border.default",
  blockSize: "2.5",
  borderRadius: "full",
  flexShrink: "0",
  inlineSize: "2.5",
});

const shelfDotNeutral = css({
  background: "fg.muted",
});

export interface ShelfNavSelection {
  listActive: boolean;
  tags?: BookmarkSearchSchema["tags"] | undefined;
}

interface ShelfNavProps {
  readonly tags: ShelfTag[];
  readonly selection: ShelfNavSelection;
  readonly listSearch: BookmarkSearchSchema | undefined;
  readonly onNavigate?: (() => void) | undefined;
}

export const ShelfNav = ({
  tags,
  selection,
  listSearch,
  onNavigate,
}: ShelfNavProps) => {
  const sorted = sortTagsForNav(tags);
  const selectedTag = selection.listActive ? selection.tags?.[0] : undefined;
  const allSelected =
    selection.listActive &&
    (selection.tags === undefined || selection.tags.length === 0);

  return (
    <nav className={shelfNav} aria-label="タグ">
      <Link
        to="/bookmarks"
        search={allShelfSearch(listSearch)}
        className={shelfItem}
        data-selected={allSelected ? "true" : "false"}
        onClick={onNavigate}
      >
        <span className={cx(shelfDot, shelfDotNeutral)} aria-hidden="true" />
        <span className={shelfItemLabel}>すべて</span>
      </Link>

      {sorted.map((tag) => {
        const selected =
          selectedTag === undefined
            ? false
            : tagNamesMatch(selectedTag, tag.name);

        return (
          <Link
            key={tag.id}
            to="/bookmarks"
            search={tagShelfSearch(tag.name, listSearch)}
            className={shelfItem}
            data-selected={selected ? "true" : "false"}
            onClick={onNavigate}
          >
            <span
              className={shelfDot}
              style={
                tag.color === null || tag.color === undefined
                  ? undefined
                  : { backgroundColor: tag.color }
              }
              aria-hidden="true"
            />
            <span className={shelfItemLabel}>{tag.name}</span>
            <span className={shelfItemCount}>{tag.bookmarkCount}</span>
          </Link>
        );
      })}
    </nav>
  );
};
