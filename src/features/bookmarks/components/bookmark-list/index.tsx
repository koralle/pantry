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
import { ArrowRight, CloudOff, Inbox, Plus, RotateCw } from "lucide-react";
import type { ReactNode } from "react";
import { css } from "styled-system/css";

import { defaultBookmarkSearch } from "../../../../features/navigation/lib/bookmark-search";
import { skeletonBar } from "../../../../styles/feedback";
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
    <span className={css({ marginInlineStart: "auto" })}>
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
