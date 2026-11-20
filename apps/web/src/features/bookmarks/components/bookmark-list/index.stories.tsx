import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { ShellTag } from "../../../../features/app-shell/lib/shell-nav";
import { defaultBookmarkSearch } from "../../../../features/navigation/lib/bookmark-search";
import type { ShelfTag } from "../../../../features/tags/lib/tag-shelf";
import { orpc } from "../../../../rpc/client/query";
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

const shelfTags: ShelfTag[] = demoTags.map((tag, index) => ({
  bookmarkCount: tag.count,
  color: null,
  id: Number(tag.id),
  lastUsedAt: null,
  name: tag.name,
  pinned: index < 2,
  sortOrder: index,
}));

const storyQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: Number.POSITIVE_INFINITY,
    },
  },
});

const STORY_FRESH_UNTIL = Date.now() + 86_400_000;
storyQueryClient.setQueryData(orpc.bookmarks.counts.recent.queryKey(), 128, {
  updatedAt: STORY_FRESH_UNTIL,
});
storyQueryClient.setQueryData(orpc.bookmarks.counts.inbox.queryKey(), 3, {
  updatedAt: STORY_FRESH_UNTIL,
});
storyQueryClient.setQueryData(orpc.bookmarks.counts.favorites.queryKey(), 6, {
  updatedAt: STORY_FRESH_UNTIL,
});
storyQueryClient.setQueryData(orpc.tags.shelf.queryKey(), shelfTags, {
  updatedAt: STORY_FRESH_UNTIL,
});

const demoItems: BookmarkRowProps[] = [
  {
    dateLabel: "2h",
    domain: "tanstack.com",
    id: "1",
    tags: [{ name: "frontend" }, { name: "tanstack" }],
    title: "TanStack Router の型安全な検索パラメータ",
    url: "https://tanstack.com/router/latest",
  },
  {
    dateLabel: "1d",
    domain: "panda-css.com",
    id: "2",
    starred: true,
    tags: [{ name: "css" }, { name: "design" }],
    title: "Panda CSS デザイントークン設計ガイド",
    url: "https://panda-css.com/docs/theming/tokens",
  },
  {
    dateLabel: "3d",
    domain: "orm.drizzle.team",
    id: "3",
    tags: [{ name: "db" }],
    title: "Drizzle ORM マイグレーション入門",
    url: "https://orm.drizzle.team/docs/migrations",
  },
  {
    dateLabel: "5d",
    domain: "valibot.dev",
    faviconFailed: true,
    id: "4",
    tags: [{ name: "frontend" }, { name: "db" }],
    title: "Valibot スキーマ検証の実践パターン",
    url: "https://valibot.dev/guides/introduction/",
  },
  {
    dateLabel: "1w",
    domain: "developer.mozilla.org",
    id: "5",
    title: "MDN: aria-describedby の使い方",
    url: "https://developer.mozilla.org/ja/docs/Web/Accessibility/ARIA/Attributes/aria-describedby",
  },
];

const meta = {
  args: {
    listSearch: defaultBookmarkSearch,
    state: "ideal",
    title: "最近保存したもの",
    view: "recent",
  },
  component: BookmarkListView,
  decorators: [
    (Story) => (
      <QueryClientProvider client={storyQueryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  parameters: { layout: "fullscreen" },
  title: "Screens / BookmarkList",
} satisfies Meta<typeof BookmarkListView>;

export default meta;

type Story = StoryObj<typeof meta>;

const Screen = (props: Partial<Parameters<typeof BookmarkListView>[0]>) => (
  <BookmarkListView
    listSearch={defaultBookmarkSearch}
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
