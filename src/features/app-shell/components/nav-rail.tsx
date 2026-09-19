/**
 * @file nav-rail.tsx
 *
 * Input:    active view, view counts, tag list, active tag
 * Output:   NavRail component
 * Position: Desktop left rail — view navigation + tag filters (hidden below md)
 *
 * SYNC: When modified, update these files to stay in sync:
 * - ./app-shell.tsx, ./app-shell.stories.tsx
 * - ../../../styles/shell.ts (rail* recipes)
 */

import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { History, Inbox, Star, Tag } from "lucide-react";
import { cx } from "styled-system/css";

import { TagDot } from "../../../shared/components/tag-chip";
import { toneFor } from "../../../styles/domain-tone";
import {
  rail,
  railCount,
  railIcon,
  railItem,
  railSection,
} from "../../../styles/shell";
import { defaultBookmarkSearch } from "../../navigation/lib/bookmark-search";
import type { ShellCounts, ShellTag, ShellView } from "../lib/shell-nav";

const viewItems: {
  view: "recent" | "inbox" | "favorites";
  icon: LucideIcon;
  label: string;
}[] = [
  { icon: History, label: "最近保存したもの", view: "recent" },
  { icon: Inbox, label: "未整理", view: "inbox" },
  { icon: Star, label: "お気に入り", view: "favorites" },
];

const countFor = (
  counts: ShellCounts | undefined,
  view: ShellView
): number | undefined => {
  if (view === "recent") {
    return counts?.recent;
  }
  if (view === "inbox") {
    return counts?.inbox;
  }
  if (view === "favorites") {
    return counts?.favorites;
  }
  return undefined;
};

export interface NavRailProps {
  view: ShellView;
  counts?: ShellCounts | undefined;
  tags?: ShellTag[] | undefined;
  activeTagId?: string | undefined;
}

const NO_TAGS: ShellTag[] = [];

export const NavRail = ({
  view,
  counts,
  tags = NO_TAGS,
  activeTagId,
}: NavRailProps) => (
  <nav aria-label="ビュー" className={rail}>
    {viewItems.map(({ view: itemView, icon: Icon, label }) => {
      const count = countFor(counts, itemView);
      return (
        <Link
          className={railItem({ active: view === itemView })}
          key={itemView}
          search={{ ...defaultBookmarkSearch, view: itemView }}
          to="/bookmarks"
        >
          <Icon
            aria-hidden
            className={cx(railIcon, "pantry-rail-icon")}
            size={15}
          />
          {label}
          {count === undefined ? null : (
            <span className={cx(railCount, "pantry-rail-count")}>{count}</span>
          )}
        </Link>
      );
    })}
    <p className={railSection}>タグ</p>
    <Link
      className={railItem({ active: view === "tags" })}
      search={{ limit: 50, offset: 0 }}
      to="/tags"
    >
      <Tag aria-hidden className={cx(railIcon, "pantry-rail-icon")} size={15} />
      タグ管理
    </Link>
    {tags.map((tag) => (
      <Link
        className={railItem({ active: activeTagId === tag.id })}
        key={tag.id}
        search={{ ...defaultBookmarkSearch, tags: [tag.name] }}
        to="/bookmarks"
      >
        <TagDot color={tag.color} tone={toneFor(tag.name)} />
        {tag.name}
        <span className={cx(railCount, "pantry-rail-count")}>{tag.count}</span>
      </Link>
    ))}
  </nav>
);
