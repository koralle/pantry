/**
 * @file top-bar.tsx
 *
 * Input:    account-active flag, CommandBar props
 * Output:   TopBar component
 * Position: 52px top bar — wordmark, command bar, new-bookmark CTA, account icon
 *
 * SYNC: When modified, update these files to stay in sync:
 * - ./app-shell.tsx (composition + keyboard shortcuts)
 * - ../../../styles/shell.ts (topbar / wordmark / commandBar recipes)
 */

import { Link } from "@tanstack/react-router";
import { Plus, UserRound } from "lucide-react";
import { css, cx } from "styled-system/css";

import { button } from "../../../styles/button";
import { iconButton } from "../../../styles/icon-button";
import { kbd, topbar, wordmark } from "../../../styles/shell";
import type { BookmarkDetailSearch } from "../../navigation/lib/bookmark-search";
import { defaultBookmarkSearch } from "../../navigation/lib/bookmark-search";
import type { CommandBarProps } from "./command-bar";
import { CommandBar } from "./command-bar";

const desktopOnly = css({
  display: "none",
  md: {
    display: "inline-flex",
  },
});

const wordmarkDesktop = css({
  display: "none",
  md: {
    display: "inline",
  },
});

export interface TopBarProps {
  accountActive?: boolean;
  newSearch?: BookmarkDetailSearch | undefined;
  search: CommandBarProps;
}

export const TopBar = ({
  accountActive = false,
  newSearch,
  search,
}: TopBarProps) => (
  <header className={topbar}>
    <Link
      className={cx(wordmark, wordmarkDesktop)}
      search={defaultBookmarkSearch}
      to="/bookmarks"
    >
      PANTRY
    </Link>
    <CommandBar key={search.defaultValue ?? ""} {...search} />
    <Link
      className={cx(button({ size: "sm", visual: "accent" }), desktopOnly)}
      search={newSearch ?? {}}
      to="/bookmarks/quick"
    >
      <Plus aria-hidden size={13} />
      登録
      <kbd className={kbd({ tone: "onAccent" })}>N</kbd>
    </Link>
    <Link
      aria-current={accountActive ? "page" : undefined}
      aria-label="アカウント"
      className={iconButton({ active: accountActive, size: "lg" })}
      to="/settings"
    >
      <UserRound aria-hidden size={17} />
    </Link>
  </header>
);
