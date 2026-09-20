/**
 * @file bottom-tabs.tsx
 *
 * Input:    active view, new-bookmark return search
 * Output:   BottomTabs component
 * Position: Mobile-only bottom tab bar with the centered quick-add FAB
 *           (hidden at md and up)
 *
 * SYNC: When modified, update these files to stay in sync:
 * - ./app-shell.tsx, ./app-shell.stories.tsx
 * - ../../../styles/shell.ts (bottomTabs / tabItem / fab recipes)
 */

import { Link } from "@tanstack/react-router";
import { History, Inbox, Plus, Star, Tag } from "lucide-react";

import { bottomTabs, fab, tabItem } from "../../../styles/shell";
import type { BookmarkDetailSearch } from "../../navigation/lib/bookmark-search";
import { defaultBookmarkSearch } from "../../navigation/lib/bookmark-search";
import type { ShellView } from "../lib/shell-nav";

export interface BottomTabsProps {
  newSearch?: BookmarkDetailSearch | undefined;
  view: ShellView;
  /** 一覧の表示レイアウトをビュー遷移で引き継ぐ */
  layout?: "rows" | "cards" | undefined;
}

export const BottomTabs = ({ newSearch, view, layout }: BottomTabsProps) => {
  const layoutParam = layout === "cards" ? { layout: "cards" as const } : {};
  return (
    <nav aria-label="ビュー" className={bottomTabs}>
      <Link
        aria-current={view === "recent" ? "page" : undefined}
        className={tabItem({ active: view === "recent" })}
        search={{ ...defaultBookmarkSearch, ...layoutParam }}
        to="/bookmarks"
      >
        <History aria-hidden size={19} />
        最近
      </Link>
      <Link
        aria-current={view === "inbox" ? "page" : undefined}
        className={tabItem({ active: view === "inbox" })}
        search={{ ...defaultBookmarkSearch, ...layoutParam, view: "inbox" }}
        to="/bookmarks"
      >
        <Inbox aria-hidden size={19} />
        未整理
      </Link>
      <Link
        aria-label="ブックマークを登録"
        className={fab}
        search={newSearch ?? {}}
        to="/bookmarks/quick"
      >
        <Plus aria-hidden size={22} />
      </Link>
      <Link
        aria-current={view === "favorites" ? "page" : undefined}
        className={tabItem({ active: view === "favorites" })}
        search={{ ...defaultBookmarkSearch, ...layoutParam, view: "favorites" }}
        to="/bookmarks"
      >
        <Star aria-hidden size={19} />
        お気に入り
      </Link>
      <Link
        aria-current={view === "tags" ? "page" : undefined}
        className={tabItem({ active: view === "tags" })}
        search={{ limit: 50, offset: 0 }}
        to="/tags"
      >
        <Tag aria-hidden size={19} />
        タグ
      </Link>
    </nav>
  );
};
