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
 * - ../../../styles/shell.ts (shell layout recipes)
 */

import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

import {
  shellBody,
  shellMain,
  shellRoot,
  skipLink,
} from "../../../styles/shell";
import type { BookmarkDetailSearch } from "../../navigation/lib/bookmark-search";
import type { ShellView } from "../lib/shell-nav";
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

export interface AppShellProps {
  view: ShellView;
  /** Rail content — pass `<NavRailRoute>` (connected) or `<NavRail>` (fixtures). */
  rail: ReactNode;
  newSearch?: BookmarkDetailSearch | undefined;
  searchDefaultValue?: string | undefined;
  onSearchSubmit: (value: string) => void;
  children: ReactNode;
}

export const AppShell = ({
  view,
  rail,
  newSearch,
  searchDefaultValue,
  onSearchSubmit,
  children,
}: AppShellProps) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }
      if (
        event.key === "n" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isEditableTarget(event.target)
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
        <BottomTabs newSearch={newSearch} view={view} />
      )}
    </div>
  );
};
