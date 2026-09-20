import type { Meta, StoryObj } from "@storybook/tanstack-react";

import type { ShellTag } from "../../../../features/app-shell/lib/shell-nav";
import { defaultBookmarkSearch } from "../../../../features/navigation/lib/bookmark-search";
import type { BookmarkRowProps } from "../bookmark-row";
import { BookmarkListView } from "./index";

const demoTags: ShellTag[] = [
  { count: 34, id: "1", name: "frontend" },
  { count: 18, id: "2", name: "tanstack" },
  { count: 12, id: "3", name: "db" },
  { count: 9, id: "4", name: "auth" },
  { count: 7, id: "5", name: "design" },
  { count: 11, id: "6", name: "infra" },
];

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
  args: {
    listSearch: defaultBookmarkSearch,
    onSearchSubmit: () => {},
    searchDefaultValue: "",
    state: "ideal",
    title: "最近保存したもの",
    view: "recent",
  },
  component: BookmarkListView,
  parameters: { layout: "fullscreen" },
  title: "Screens / BookmarkList",
} satisfies Meta<typeof BookmarkListView>;

export default meta;

type Story = StoryObj<typeof meta>;

const Screen = (props: Partial<Parameters<typeof BookmarkListView>[0]>) => (
  <BookmarkListView
    listSearch={defaultBookmarkSearch}
    onSearchSubmit={() => {}}
    searchDefaultValue=""
    state="ideal"
    title="最近保存したもの"
    view="recent"
    {...props}
  />
);

export const Ideal = {
  name: "標準",
  args: meta.args,
  render: () => (
    <Screen
      count={128}
      counts={{ favorites: 6, inbox: 3, recent: 128 }}
      inboxCount={3}
      items={demoItems}
      selectedId="1"
      tags={demoTags}
    />
  ),
} satisfies Story;

export const Loading = {
  name: "読み込み中",
  args: meta.args,
  render: () => (
    <Screen
      counts={{ favorites: 6, inbox: 3, recent: 128 }}
      state="loading"
      tags={demoTags}
    />
  ),
} satisfies Story;

export const Empty = {
  name: "空",
  args: meta.args,
  render: () => <Screen count={0} counts={{ recent: 0 }} state="empty" />,
} satisfies Story;

export const Error = {
  name: "エラー",
  args: meta.args,
  render: () => (
    <Screen counts={{ favorites: 6, inbox: 3, recent: 128 }} state="error" />
  ),
} satisfies Story;

export const Partial = {
  name: "一部のみ",
  args: meta.args,
  render: () => (
    <Screen
      count={128}
      counts={{ favorites: 6, inbox: 3, recent: 128 }}
      items={demoItems}
      onRetry={() => {}}
      selectedId="1"
      state="partial"
      tags={demoTags}
    />
  ),
} satisfies Story;

export const Inbox = {
  name: "未整理",
  args: meta.args,
  render: () => (
    <Screen
      count={3}
      counts={{ favorites: 6, inbox: 3, recent: 128 }}
      items={demoItems.slice(0, 3)}
      title="未整理"
      view="inbox"
    />
  ),
} satisfies Story;

export const TagFiltered = {
  name: "タグで絞り込み",
  args: meta.args,
  render: () => (
    <Screen
      activeTagId="1"
      count={34}
      counts={{ favorites: 6, inbox: 3, recent: 128 }}
      items={demoItems}
      tags={demoTags}
      title="frontend"
    />
  ),
} satisfies Story;

export const Cards = {
  name: "カード",
  args: meta.args,
  render: () => (
    <Screen
      count={128}
      counts={{ favorites: 6, inbox: 3, recent: 128 }}
      inboxCount={3}
      items={demoItems}
      listSearch={{ ...defaultBookmarkSearch, layout: "cards" }}
      selectedId="1"
      tags={demoTags}
    />
  ),
} satisfies Story;

export const Mobile = {
  name: "モバイル",
  args: meta.args,
  parameters: { viewport: { defaultViewport: "iphone12" } },
  render: () => (
    <Screen
      count={128}
      counts={{ favorites: 6, inbox: 3, recent: 128 }}
      inboxCount={3}
      items={demoItems}
      tags={demoTags}
    />
  ),
} satisfies Story;
