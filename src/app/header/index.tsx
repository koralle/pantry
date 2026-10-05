/**
 * @file app-header.tsx
 *
 * Input:    なし（現在地から導出）
 * Output:   AppHeader component
 * Position: 52px top bar — wordmark, new-bookmark CTA, account icon
 *
 * SYNC: When modified, update these files to stay in sync:
 * - ./layout.tsx (composition)
 * - ../../features/app-shell/styles.ts (topbar / wordmark recipes)
 */
import { Link, useMatchRoute } from "@tanstack/react-router";
import { Plus, UserRound } from "lucide-react";
import { css, cx } from "styled-system/css";

import { topbar, wordmark } from "../../features/app-shell/styles";
import { defaultBookmarkSearch } from "../../features/navigation/lib/bookmark-search";
import { iconButton } from "../../shared/components/icon-button/styles";
import { Kbd } from "../../shared/components/kbd";
import { button } from "../../shared/components/styled-button/styles";

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

export const AppHeader = () => {
  const matchRoute = useMatchRoute();
  const isSettingPageActive = !!matchRoute({ to: "/settings" });

  return (
    <header className={topbar}>
      <Link
        className={cx(wordmark, wordmarkDesktop)}
        search={defaultBookmarkSearch}
        to="/bookmarks"
      >
        PANTRY
      </Link>

      <Link
        className={cx(button({ size: "sm", visual: "accent" }), desktopOnly)}
        search={{}}
        to="/bookmarks/quick"
      >
        <Plus aria-hidden size={13} />
        登録
        <Kbd tone="onAccent">N</Kbd>
      </Link>

      <Link
        aria-current={isSettingPageActive ? "page" : undefined}
        aria-label="アカウント"
        className={iconButton({ active: isSettingPageActive, size: "lg" })}
        to="/settings"
      >
        <UserRound aria-hidden size={17} />
      </Link>
    </header>
  );
};
