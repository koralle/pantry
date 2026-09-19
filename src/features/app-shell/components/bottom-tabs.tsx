/**
 * @file bottom-tabs.tsx
 *
 * Input:    active view
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
import { defaultBookmarkSearch } from "../../navigation/lib/bookmark-search";
import type { ShellView } from "../lib/shell-nav";

export interface BottomTabsProps {
  view: ShellView;
}

export const BottomTabs = ({ view }: BottomTabsProps) => (
  <nav aria-label="ビュー" className={bottomTabs}>
    <Link
      className={tabItem({ active: view === "recent" })}
      search={{ ...defaultBookmarkSearch, view: "recent" }}
      to="/bookmarks"
    >
      <History aria-hidden size={19} />
      最近
    </Link>
    <Link
      className={tabItem({ active: view === "inbox" })}
      search={{ ...defaultBookmarkSearch, view: "inbox" }}
      to="/bookmarks"
    >
      <Inbox aria-hidden size={19} />
      未整理
    </Link>
    <Link aria-label="ブックマークを登録" className={fab} to="/bookmarks/new">
      <Plus aria-hidden size={22} />
    </Link>
    <Link
      className={tabItem({ active: view === "favorites" })}
      search={{ ...defaultBookmarkSearch, view: "favorites" }}
      to="/bookmarks"
    >
      <Star aria-hidden size={19} />
      お気に入り
    </Link>
    <Link
      className={tabItem({ active: view === "tags" })}
      search={{ limit: 50, offset: 0 }}
      to="/tags"
    >
      <Tag aria-hidden size={19} />
      タグ
    </Link>
  </nav>
);
