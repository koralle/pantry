/**
 * @file index.tsx
 *
 * Input:    なし（現在地から導出）
 * Output:   AppHeader component
 * Position: Top bar — brand wordmark (left), desktop new-bookmark CTA + account icon (right)
 *
 * SYNC: When modified, update these files to stay in sync:
 * - ../layout.tsx (composition)
 * - ../../features/app-shell/styles.ts (topbar / wordmark recipes)
 */
import { Link, useMatchRoute } from "@tanstack/react-router";
import { Package, Plus, UserRound } from "lucide-react";

import {
  desktopOnlyWrap,
  topbar,
  topbarActions,
  wordmark,
  wordmarkBadge,
} from "../../features/app-shell/styles";
import { defaultBookmarkSearch } from "../../features/navigation/lib/bookmark-search";
import { iconButton } from "../../shared/components/icon-button/styles";
import { button } from "../../shared/components/styled-button/styles";

export const AppHeader = () => {
  const matchRoute = useMatchRoute();
  const isSettingPageActive = !!matchRoute({ to: "/settings" });

  return (
    <header className={topbar}>
      <Link className={wordmark} search={defaultBookmarkSearch} to="/bookmarks">
        <span aria-hidden className={wordmarkBadge}>
          <Package size={15} />
        </span>
        <span translate="no">Pantry</span>
      </Link>

      <div className={topbarActions}>
        <div className={desktopOnlyWrap}>
          <Link
            className={button({ size: "sm", visual: "accent" })}
            search={{}}
            to="/bookmarks/quick"
          >
            <Plus aria-hidden size={14} />
            登録
          </Link>
        </div>

        <Link
          aria-current={isSettingPageActive ? "page" : undefined}
          aria-label="アカウント"
          className={iconButton({ active: isSettingPageActive, size: "lg" })}
          to="/settings"
        >
          <UserRound aria-hidden size={18} />
        </Link>
      </div>
    </header>
  );
};
