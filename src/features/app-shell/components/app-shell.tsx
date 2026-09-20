/**
 * @file app-shell.tsx
 *
 * Input:    shell nav state, search props, page content
 * Output:   AppShell component
 * Position: Authenticated app chrome — top bar + rail (desktop) /
 *           bottom tabs + FAB (mobile); hosts ⌘K and N shortcuts
 *
 * SYNC: When modified, update these files to stay in sync:
 * - ./app-shell.stories.tsx
 * - ../styles.ts (shell layout recipes)
 */

import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

import type { BookmarkDetailSearch } from "../../navigation/lib/bookmark-search";
import type { ShellView } from "../lib/shell-nav";
import { shellBody, shellMain, shellRoot, skipLink } from "../styles";
import { BottomTabs } from "./bottom-tabs";
import { TopBar } from "./top-bar";

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  );
};

/** モーダル表示中はグローバルショートカットを効かせない */
const isDialogOpen = (): boolean =>
  document.querySelector("[role='dialog'], [role='alertdialog']") !== null;

export interface AppShellProps {
  view: ShellView;
  /** Rail content — pass `<NavRailRoute>` (connected) or `<NavRail>` (fixtures). */
  rail: ReactNode;
  newSearch?: BookmarkDetailSearch | undefined;
  searchDefaultValue?: string | undefined;
  /** 一覧の表示レイアウト。下部タブのビュー遷移へ引き継ぐ */
  layout?: "rows" | "cards" | undefined;
  onSearchSubmit: (value: string) => void;
  children: ReactNode;
}

export const AppShell = ({
  view,
  rail,
  newSearch,
  searchDefaultValue,
  layout,
  onSearchSubmit,
  children,
}: AppShellProps) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.length === 1 &&
        event.key.toLowerCase() === "k" &&
        !isDialogOpen()
      ) {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }
      if (
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isEditableTarget(event.target) &&
        !isDialogOpen()
      ) {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (
        event.key.length === 1 &&
        event.key.toLowerCase() === "n" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isEditableTarget(event.target) &&
        !isDialogOpen()
      ) {
        event.preventDefault();
        void navigate({ search: newSearch ?? {}, to: "/bookmarks/quick" });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [navigate, newSearch]);

  return (
    <div className={shellRoot}>
      <a className={skipLink} href="#content">
        本文へ
      </a>
      <TopBar
        accountActive={view === "account"}
        newSearch={newSearch}
        search={{
          defaultValue: searchDefaultValue,
          inputRef: searchInputRef,
          onSubmit: onSearchSubmit,
        }}
      />
      <div className={shellBody}>
        {rail}
        <main
          className={shellMain}
          data-scroll-restoration-id="content"
          id="content"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
      {view === "account" ? null : (
        <BottomTabs layout={layout} newSearch={newSearch} view={view} />
      )}
    </div>
  );
};
