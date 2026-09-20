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
 * - ../../styles.ts
 */

import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bookmark,
  CloudOff,
  Inbox,
  LayoutGrid,
  List,
  Plus,
  RotateCw,
  WifiOff,
} from "lucide-react";
import type { ReactNode } from "react";
import { css, cx } from "styled-system/css";

import { AppShell } from "../../../../features/app-shell/components/app-shell";
import { NavRail } from "../../../../features/app-shell/components/nav-rail";
import type {
  ShellCounts,
  ShellTag,
  ShellView,
} from "../../../../features/app-shell/lib/shell-nav";
import type {
  BookmarkDetailSearch,
  BookmarkSearchSchema,
} from "../../../../features/navigation/lib/bookmark-search";
import { defaultBookmarkSearch } from "../../../../features/navigation/lib/bookmark-search";
import { buildListSearch } from "../../../../features/navigation/lib/bookmark-search-builders";
import { StateView } from "../../../../shared/components/state-view";
import { button } from "../../../../shared/components/styled-button/styles";
import { skeletonBar, spinner } from "../../../../shared/styles/feedback";
import { kbd } from "../../../../shared/styles/kbd";
import {
  desktopOnlyText,
  hintBar,
  inboxAction,
  inboxBadge,
  inboxCallout,
  inboxSub,
  inboxTitle,
  listBanner,
  listBannerAction,
  listHead,
  listScroll,
  listSub,
  listTitle,
  listTools,
  mobileOnlyText,
  quickAddBadge,
  quickAddStrip,
  rows,
  rowsMobileOnly,
  segControl,
  segItem,
  skeletonBody,
  skeletonRow,
  stateFill,
} from "../../styles";
import { BookmarkCardGrid } from "../bookmark-card";
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

export const QuickAddStrip = ({
  search = defaultBookmarkSearch,
}: {
  search?: BookmarkDetailSearch | undefined;
}) => (
  <Link className={quickAddStrip} search={search} to="/bookmarks/quick">
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
  /** 遷移先の未整理ビューへ引き継ぐ表示レイアウト */
  layout?: BookmarkSearchSchema["layout"];
}

export const InboxCallout = ({ count, layout }: InboxCalloutProps) => (
  <Link
    className={inboxCallout}
    search={{
      ...defaultBookmarkSearch,
      ...(layout === "cards" ? { layout: "cards" as const } : {}),
      view: "inbox",
    }}
    to="/bookmarks"
  >
    <span className={inboxBadge}>
      <Inbox aria-hidden size={15} />
    </span>
    <div>
      <div className={inboxTitle}>
        <span className={desktopOnlyText}>未整理が {count} 件あります</span>
        <span className={mobileOnlyText}>未整理 {count} 件</span>
      </div>
      <div className={inboxSub}>
        <span className={desktopOnlyText}>タグを付けると棚に移ります</span>
        <span className={mobileOnlyText}>まとめて整理 →</span>
      </div>
    </div>
    <span className={inboxAction}>
      まとめて整理
      <ArrowRight aria-hidden size={12} />
    </span>
  </Link>
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
  /** カード表示時のモバイル fallback 用。デスクトップではグリッド側が出る。 */
  mobileOnly?: boolean | undefined;
}

export const BookmarkRows = ({
  items,
  selectedId,
  mobileOnly,
}: BookmarkRowsProps) => (
  <div className={cx(rows, mobileOnly === true ? rowsMobileOnly : undefined)}>
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

export type BookmarkListLayout = "rows" | "cards";

export const ViewToggle = ({
  listSearch,
}: {
  listSearch: BookmarkSearchSchema;
}) => {
  const layout = listSearch.layout ?? "rows";
  return (
    <div className={segControl}>
      <Link
        aria-current={layout === "rows" ? "true" : undefined}
        className={segItem({ on: layout === "rows" })}
        search={buildListSearch(listSearch, { layout: "rows" })}
        to="/bookmarks"
      >
        <List aria-hidden size={12} />
        リスト
      </Link>
      <Link
        aria-current={layout === "cards" ? "true" : undefined}
        className={segItem({ on: layout === "cards" })}
        search={buildListSearch(listSearch, { layout: "cards" })}
        to="/bookmarks"
      >
        <LayoutGrid aria-hidden size={12} />
        カード
      </Link>
    </div>
  );
};

export const HintBar = () => (
  <div className={hintBar}>
    <span>
      <b>j</b> <b>k</b> 移動
    </span>
    <span>
      <b>⏎</b> 開く
    </span>
    <span>
      <b>T</b> タグで絞る
    </span>
    <span>
      <b>N</b> 新規登録
    </span>
    <span>
      <b>/</b> 検索
    </span>
  </div>
);

export interface BookmarkListContentProps {
  title: string;
  state: BookmarkListState;
  listSearch: BookmarkSearchSchema;
  items?: BookmarkRowProps[] | undefined;
  count?: number | undefined;
  inboxCount?: number | undefined;
  selectedId?: string | undefined;
  emptyVariant?: "blank" | "filtered" | undefined;
  clearSearch?: BookmarkSearchSchema | undefined;
  newSearch?: BookmarkDetailSearch | undefined;
  onRetry?: (() => void) | undefined;
  /** 一覧末尾に出す要素（「もっと見る」など）。スクロール領域の内側に置く。 */
  trailing?: ReactNode | undefined;
}

export const BookmarkListContent = ({
  title,
  state,
  listSearch,
  items,
  count,
  inboxCount,
  selectedId,
  emptyVariant = "blank",
  clearSearch,
  newSearch,
  onRetry,
  trailing,
}: BookmarkListContentProps) => {
  const cards = listSearch.layout === "cards";
  let listBody: ReactNode = null;
  if (state === "ideal" || state === "partial") {
    listBody = cards ? (
      <>
        <BookmarkCardGrid items={items ?? []} selectedId={selectedId} />
        <BookmarkRows items={items ?? []} mobileOnly selectedId={selectedId} />
      </>
    ) : (
      <BookmarkRows items={items ?? []} selectedId={selectedId} />
    );
  }
  return (
    <>
      <ListHead
        count={state === "loading" ? undefined : count}
        title={title}
        tools={
          <>
            {state === "loading" ? (
              <output className={loadingNote}>
                <span aria-hidden className={spinner} />
                読み込み中…
              </output>
            ) : null}
            <ViewToggle listSearch={listSearch} />
          </>
        }
      />
      {state === "ideal" && inboxCount ? (
        <InboxCallout count={inboxCount} layout={listSearch.layout} />
      ) : null}
      {state === "ideal" || state === "empty" ? (
        <QuickAddStrip search={newSearch} />
      ) : null}
      {state === "partial" ? (
        <ListBanner onRetry={onRetry}>
          ファビコンを一部取得できませんでした
        </ListBanner>
      ) : null}
      <div className={listScroll} data-list-scroll>
        {state === "loading" ? <BookmarkRowsSkeleton /> : null}
        {listBody}
        {state === "empty" && emptyVariant === "blank" ? (
          <StateView
            action={
              <Link
                className={button({ size: "sm", visual: "accent" })}
                search={newSearch ?? defaultBookmarkSearch}
                to="/bookmarks/new"
              >
                <Plus aria-hidden size={13} />
                最初の1件を登録
              </Link>
            }
            className={stateFill}
            description="URLをペーストすればタイトルは自動で取り込みます。タグ付けはあとでまとめてできます。"
            icon={Bookmark}
            title="まだブックマークがありません"
          />
        ) : null}
        {state === "empty" && emptyVariant === "filtered" ? (
          <StateView
            action={
              <Link
                className={button({ size: "sm", visual: "accent" })}
                search={clearSearch ?? defaultBookmarkSearch}
                to="/bookmarks"
              >
                条件をクリア
              </Link>
            }
            className={stateFill}
            description="検索語やタグを変えると見つかるかもしれません。"
            icon={Bookmark}
            title="条件に合うブックマークがありません"
          />
        ) : null}
        {state === "error" ? (
          <div className={stateFill} role="alert">
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
          </div>
        ) : null}
        {trailing}
      </div>
      <HintBar />
    </>
  );
};

export interface BookmarkListViewProps extends BookmarkListContentProps {
  view: ShellView;
  counts?: ShellCounts | undefined;
  tags?: ShellTag[] | undefined;
  activeTagId?: string | undefined;
  searchDefaultValue?: string | undefined;
  onSearchSubmit: (value: string) => void;
}

export const BookmarkListView = ({
  view,
  counts,
  tags,
  activeTagId,
  searchDefaultValue,
  onSearchSubmit,
  ...content
}: BookmarkListViewProps) => (
  <AppShell
    layout={content.listSearch.layout}
    onSearchSubmit={onSearchSubmit}
    rail={
      <NavRail
        activeTagId={activeTagId}
        counts={counts}
        layout={content.listSearch.layout}
        tags={tags}
        view={view}
      />
    }
    searchDefaultValue={searchDefaultValue}
    view={view}
  >
    <BookmarkListContent {...content} />
  </AppShell>
);
