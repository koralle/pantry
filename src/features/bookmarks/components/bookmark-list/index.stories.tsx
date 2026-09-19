import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { Bookmark, Plus, RotateCw, WifiOff } from "lucide-react";
import { css } from "styled-system/css";

import { StateView } from "../../../../shared/components/state-view";
import { spinner } from "../../../../styles/feedback";
import type { BookmarkRowProps } from "../bookmark-row";
import {
  BookmarkRows,
  BookmarkRowsSkeleton,
  InboxCallout,
  ListBanner,
  ListHead,
  QuickAddStrip,
} from "./index";

const surface = css({
  background: "bg.canvas",
  blockSize: "[32rem]",
  display: "flex",
  flexDirection: "column",
  inlineSize: "[42rem]",
});

const Demo = ({ children }: { children: React.ReactNode }) => (
  <div className={surface}>{children}</div>
);

const demoItems: BookmarkRowProps[] = [
  {
    dateLabel: "2h",
    domain: "tanstack.com",
    id: "1",
    tags: [{ name: "frontend" }, { name: "tanstack" }],
    title: "TanStack Router の型安全な検索パラメータ",
  },
  {
    dateLabel: "1d",
    domain: "panda-css.com",
    id: "2",
    starred: true,
    tags: [{ name: "css" }, { name: "design" }],
    title: "Panda CSS デザイントークン設計ガイド",
  },
  {
    dateLabel: "3d",
    domain: "orm.drizzle.team",
    id: "3",
    tags: [{ name: "db" }],
    title: "Drizzle ORM マイグレーション入門",
  },
  {
    dateLabel: "5d",
    domain: "valibot.dev",
    faviconFailed: true,
    id: "4",
    tags: [{ name: "frontend" }, { name: "db" }],
    title: "Valibot スキーマ検証の実践パターン",
  },
  {
    dateLabel: "1w",
    domain: "developer.mozilla.org",
    id: "5",
    title: "MDN: aria-describedby の使い方",
  },
];

const meta = {
  component: ListHead,
  parameters: { layout: "fullscreen" },
  title: "Features / BookmarkList",
} satisfies Meta<typeof ListHead>;

export default meta;

type Story = StoryObj<typeof meta>;

const args = { title: "最近保存したもの" };

export const Ideal = {
  args,
  render: () => (
    <Demo>
      <ListHead count={128} title="最近保存したもの" />
      <InboxCallout count={3} />
      <QuickAddStrip />
      <BookmarkRows items={demoItems} selectedId="1" />
    </Demo>
  ),
} satisfies Story;

export const Loading = {
  args,
  render: () => (
    <Demo>
      <ListHead
        title="最近保存したもの"
        tools={
          <span
            className={css({
              alignItems: "center",
              color: "fg.faint",
              columnGap: "1.5",
              display: "flex",
              fontSize: "2xs",
            })}
          >
            <span aria-hidden className={spinner} />
            読み込み中…
          </span>
        }
      />
      <BookmarkRowsSkeleton />
    </Demo>
  ),
} satisfies Story;

export const Empty = {
  args,
  render: () => (
    <Demo>
      <ListHead count={0} title="最近保存したもの" />
      <QuickAddStrip />
      <StateView
        action={
          <span
            className={css({
              alignItems: "center",
              background: "accent.solid",
              borderRadius: "[0.5625rem]",
              color: "accent.fg",
              columnGap: "1.5",
              display: "inline-flex",
              fontSize: "xs",
              fontWeight: "bold",
              paddingBlock: "2",
              paddingInline: "3.5",
            })}
          >
            <Plus aria-hidden size={13} />
            最初の1件を登録
          </span>
        }
        description="URLをペーストすればタイトルは自動で取り込みます。タグ付けはあとでまとめてできます。"
        icon={Bookmark}
        title="まだブックマークがありません"
      />
    </Demo>
  ),
} satisfies Story;

export const Error = {
  args,
  render: () => (
    <Demo>
      <ListHead title="最近保存したもの" />
      <StateView
        action={
          <span
            className={css({
              alignItems: "center",
              background: "accent.solid",
              borderRadius: "[0.5625rem]",
              color: "accent.fg",
              columnGap: "1.5",
              cursor: "pointer",
              display: "inline-flex",
              fontSize: "xs",
              fontWeight: "bold",
              paddingBlock: "2",
              paddingInline: "3.5",
            })}
          >
            <RotateCw aria-hidden size={13} />
            再試行
          </span>
        }
        description="ネットワーク接続を確認して、もう一度お試しください。"
        icon={WifiOff}
        title="読み込みに失敗しました"
        tone="danger"
      />
    </Demo>
  ),
} satisfies Story;

export const Partial = {
  args,
  render: () => (
    <Demo>
      <ListHead count={128} title="最近保存したもの" />
      <ListBanner onRetry={() => {}}>
        ファビコンを一部取得できませんでした
      </ListBanner>
      <BookmarkRows items={demoItems} selectedId="1" />
    </Demo>
  ),
} satisfies Story;
