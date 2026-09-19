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
import type { ShellCounts, ShellTag, ShellView } from "../lib/shell-nav";
import { BottomTabs } from "./bottom-tabs";
import { NavRail } from "./nav-rail";
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
  counts?: ShellCounts | undefined;
  tags?: ShellTag[] | undefined;
  activeTagId?: string | undefined;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  children: ReactNode;
}

export const AppShell = ({
  view,
  counts,
  tags,
  activeTagId,
  searchValue,
  onSearchChange,
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
        void navigate({ to: "/bookmarks/new" });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [navigate]);

  return (
    <div className={shellRoot}>
      <a className={skipLink} href="#content">
        本文へ
      </a>
      <TopBar
        accountActive={view === "account"}
        search={{
          inputRef: searchInputRef,
          onSubmit: onSearchSubmit,
          onValueChange: onSearchChange,
          value: searchValue,
        }}
      />
      <div className={shellBody}>
        <NavRail
          activeTagId={activeTagId}
          counts={counts}
          tags={tags}
          view={view}
        />
        <main className={shellMain} id="content" tabIndex={-1}>
          {children}
        </main>
      </div>
      <BottomTabs view={view} />
    </div>
  );
};
