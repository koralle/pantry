/**
 * @file index.tsx
 *
 * Input:    view title, counts, row items, state
 * Output:   ListHead / QuickAddStrip / InboxCallout / ListBanner / BookmarkRowsSkeleton
 * Position: Chrome pieces that compose the bookmark list screen states
 *
 * SYNC: When modified, update these files to stay in sync:
 * - ./index.stories.tsx
 * - ../bookmark-row/index.tsx
 * - ../../../styles/list.ts
 */

import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bookmark,
  CloudOff,
  Inbox,
  Plus,
  RotateCw,
  WifiOff,
} from "lucide-react";
import type { ReactNode } from "react";
import { css } from "styled-system/css";

import { AppShell } from "../../../../features/app-shell/components/app-shell";
import type {
  ShellCounts,
  ShellTag,
  ShellView,
} from "../../../../features/app-shell/lib/shell-nav";
import { defaultBookmarkSearch } from "../../../../features/navigation/lib/bookmark-search";
import { StateView } from "../../../../shared/components/state-view";
import { button } from "../../../../styles/button";
import { skeletonBar, spinner } from "../../../../styles/feedback";
import {
  inboxAction,
  inboxBadge,
  inboxCallout,
  inboxSub,
  inboxTitle,
  listBanner,
  listBannerAction,
  listHead,
  listSub,
  listTitle,
  listTools,
  quickAddBadge,
  quickAddStrip,
  rows,
  skeletonBody,
  skeletonRow,
} from "../../../../styles/list";
import { kbd } from "../../../../styles/shell";
import type { BookmarkRowProps } from "../bookmark-row";
import { BookmarkRow } from "../bookmark-row";

export interface ListHeadProps {
  title: string;
  count?: number | undefined;
  tools?: ReactNode;
}

export const ListHead = ({ title, count, tools }: ListHeadProps) => (
  <div className={listHead}>
    <h2 className={listTitle}>{title}</h2>
    {count === undefined ? null : <span className={listSub}>{count} 件</span>}
    {tools ? <div className={listTools}>{tools}</div> : null}
  </div>
);

export const QuickAddStrip = () => (
  <Link
    className={quickAddStrip}
    search={defaultBookmarkSearch}
    to="/bookmarks/new"
  >
    <span className={quickAddBadge}>
      <Plus aria-hidden size={12} />
    </span>
    URLをペーストすると、登録画面が開きます
    <span
      className={css({
        display: { base: "none", md: "block" },
        marginInlineStart: "auto",
      })}
    >
      <kbd className={kbd()}>⌘V</kbd>
    </span>
  </Link>
);

export interface InboxCalloutProps {
  count: number;
}

export const InboxCallout = ({ count }: InboxCalloutProps) => (
  <div className={inboxCallout}>
    <span className={inboxBadge}>
      <Inbox aria-hidden size={17} />
    </span>
    <div>
      <div className={inboxTitle}>未整理が {count} 件あります</div>
      <div className={inboxSub}>タグを付けると棚に移ります</div>
    </div>
    <Link
      className={inboxAction}
      search={{ ...defaultBookmarkSearch, view: "inbox" }}
      to="/bookmarks"
    >
      まとめて整理
      <ArrowRight aria-hidden size={12} />
    </Link>
  </div>
);

export interface ListBannerProps {
  children: ReactNode;
  onRetry?: (() => void) | undefined;
}

export const ListBanner = ({ children, onRetry }: ListBannerProps) => (
  <output className={listBanner}>
    <CloudOff aria-hidden size={15} />
    {children}
    {onRetry ? (
      <button className={listBannerAction} onClick={onRetry} type="button">
        <RotateCw aria-hidden size={12} />
        再試行
      </button>
    ) : null}
  </output>
);

export interface BookmarkRowsProps {
  items: BookmarkRowProps[];
  selectedId?: string | undefined;
}

export const BookmarkRows = ({ items, selectedId }: BookmarkRowsProps) => (
  <div className={rows}>
    {items.map((item) => (
      <BookmarkRow key={item.id} {...item} selected={item.id === selectedId} />
    ))}
  </div>
);

const skeletonTile = css({
  borderRadius: "[0.375rem]",
  blockSize: "[1.625rem]",
  flexShrink: "0",
  inlineSize: "[1.625rem]",
  md: {
    blockSize: "[1.375rem]",
    inlineSize: "[1.375rem]",
  },
});

const skeletonBar1 = css({
  blockSize: "[0.75rem]",
  inlineSize: "75%",
});

const skeletonBar2 = css({
  blockSize: "[0.625rem]",
  inlineSize: "45%",
});

export interface BookmarkRowsSkeletonProps {
  rows?: number | undefined;
}

export const BookmarkRowsSkeleton = ({
  rows: count = 5,
}: BookmarkRowsSkeletonProps) => (
  <div aria-hidden className={rows} data-testid="rows-skeleton">
    {Array.from({ length: count }, (_, i) => (
      <div className={skeletonRow} key={`skeleton-${i + 1}`}>
        <span className={`${skeletonBar} ${skeletonTile}`} />
        <span className={skeletonBody}>
          <span className={`${skeletonBar} ${skeletonBar1}`} />
          <span className={`${skeletonBar} ${skeletonBar2}`} />
        </span>
      </div>
    ))}
  </div>
);

const loadingNote = css({
  alignItems: "center",
  color: "fg.faint",
  columnGap: "1.5",
  display: "flex",
  fontSize: "2xs",
});

export type BookmarkListState =
  | "loading"
  | "ideal"
  | "empty"
  | "error"
  | "partial";

export interface BookmarkListViewProps {
  view: ShellView;
  title: string;
  state: BookmarkListState;
  items?: BookmarkRowProps[] | undefined;
  count?: number | undefined;
  inboxCount?: number | undefined;
  counts?: ShellCounts | undefined;
  tags?: ShellTag[] | undefined;
  activeTagId?: string | undefined;
  selectedId?: string | undefined;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onRetry?: (() => void) | undefined;
}

export const BookmarkListView = ({
  view,
  title,
  state,
  items,
  count,
  inboxCount,
  counts,
  tags,
  activeTagId,
  selectedId,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  onRetry,
}: BookmarkListViewProps) => (
  <AppShell
    activeTagId={activeTagId}
    counts={counts}
    onSearchChange={onSearchChange}
    onSearchSubmit={onSearchSubmit}
    searchValue={searchValue}
    tags={tags}
    view={view}
  >
    <ListHead
      count={state === "loading" ? undefined : count}
      title={title}
      tools={
        state === "loading" ? (
          <output className={loadingNote}>
            <span aria-hidden className={spinner} />
            読み込み中…
          </output>
        ) : undefined
      }
    />
    {state === "ideal" && inboxCount ? (
      <InboxCallout count={inboxCount} />
    ) : null}
    {state === "ideal" || state === "empty" ? <QuickAddStrip /> : null}
    {state === "partial" ? (
      <ListBanner onRetry={onRetry}>
        ファビコンを一部取得できませんでした
      </ListBanner>
    ) : null}
    {state === "loading" ? <BookmarkRowsSkeleton /> : null}
    {state === "ideal" || state === "partial" ? (
      <BookmarkRows items={items ?? []} selectedId={selectedId} />
    ) : null}
    {state === "empty" ? (
      <StateView
        action={
          <Link
            className={button({ size: "sm", visual: "accent" })}
            search={defaultBookmarkSearch}
            to="/bookmarks/new"
          >
            <Plus aria-hidden size={13} />
            最初の1件を登録
          </Link>
        }
        description="URLをペーストすればタイトルは自動で取り込みます。タグ付けはあとでまとめてできます。"
        icon={Bookmark}
        title="まだブックマークがありません"
      />
    ) : null}
    {state === "error" ? (
      <StateView
        action={
          <button
            className={button({ size: "sm", visual: "accent" })}
            onClick={onRetry}
            type="button"
          >
            <RotateCw aria-hidden size={13} />
            再試行
          </button>
        }
        description="ネットワーク接続を確認して、もう一度お試しください。"
        icon={WifiOff}
        title="読み込みに失敗しました"
        tone="danger"
      />
    ) : null}
  </AppShell>
);
