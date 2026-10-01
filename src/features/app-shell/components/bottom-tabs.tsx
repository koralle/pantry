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
 * - ../styles.ts (bottomTabs / tabItem / fab recipes)
 */

import { Link } from "@tanstack/react-router";
import { History, Inbox, Plus, Star, Tag } from "lucide-react";

import { useIsFavorites } from "../../../shared/hooks/use-is-favorites";
import { useIsInbox } from "../../../shared/hooks/use-is-inbox";
import { useIsRecent } from "../../../shared/hooks/use-is-recent";
import { useIsInTagPage } from "../../../shared/hooks/use-is-tag-page";
import type { BookmarkDetailSearch } from "../../navigation/lib/bookmark-search";
import { defaultBookmarkSearch } from "../../navigation/lib/bookmark-search";
import { bottomTabs, fab, tabItem } from "../styles";

export interface BottomTabsProps {
  newSearch?: BookmarkDetailSearch | undefined;
}

export const BottomTabs = ({ newSearch }: BottomTabsProps) => {
  const isInbox = useIsInbox();
  const isFavorites = useIsFavorites();
  const isRecent = useIsRecent();
  const isTagPage = useIsInTagPage();

  return (
    <nav aria-label="ビュー" className={bottomTabs}>
      <Link
        aria-current={isRecent ? "page" : undefined}
        className={tabItem({ active: isRecent })}
        search={{ ...defaultBookmarkSearch }}
        to="/bookmarks"
      >
        <History aria-hidden size={19} />
        最近
      </Link>

      <Link
        aria-current={isInbox ? "page" : undefined}
        className={tabItem({ active: isInbox })}
        search={{ ...defaultBookmarkSearch, view: "inbox" }}
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
        aria-current={isFavorites ? "page" : undefined}
        className={tabItem({ active: isFavorites })}
        search={{ ...defaultBookmarkSearch, view: "favorites" }}
        to="/bookmarks"
      >
        <Star aria-hidden size={19} />
        お気に入り
      </Link>

      <Link
        aria-current={isTagPage ? "page" : undefined}
        className={tabItem({ active: isTagPage })}
        search={{ limit: 50, offset: 0 }}
        to="/tags"
      >
        <Tag aria-hidden size={19} />
        タグ
      </Link>
    </nav>
  );
};
