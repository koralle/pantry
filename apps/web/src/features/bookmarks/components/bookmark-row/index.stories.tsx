import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { css } from "styled-system/css";

import { BookmarkRow } from "./index";

const meta = {
  args: {
    dateLabel: "2h",
    domain: "tanstack.com",
    id: "1",
    title: "TanStack Router の型安全な検索パラメータ",
  },
  component: BookmarkRow,
  decorators: [
    (Story) => (
      <div className={css({ maxInlineSize: "[38rem]" })}>
        <Story />
      </div>
    ),
  ],
  title: "Features / BookmarkRow",
} satisfies Meta<typeof BookmarkRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = { name: "既定" } satisfies Story;

export const Selected = {
  name: "選択中",
  args: { selected: true },
} satisfies Story;

export const Starred = {
  name: "お気に入り",
  args: { starred: true },
} satisfies Story;

export const WithTags = {
  name: "タグ付き",
  args: {
    tags: [{ name: "frontend" }, { name: "tanstack" }, { name: "design" }],
  },
} satisfies Story;

export const FaviconFailed = {
  name: "Favicon取得失敗",
  args: { faviconFailed: true },
} satisfies Story;

export const LongTitle = {
  name: "長いタイトル",
  args: {
    tags: [{ name: "frontend" }, { name: "db" }],
    title:
      "Valibot スキーマ検証の実践パターンと移行ガイド：Zod からの段階的置き換えを試してみた記録",
  },
} satisfies Story;

export const Full = {
  name: "全要素あり",
  args: {
    faviconFailed: true,
    selected: true,
    starred: true,
    tags: [{ name: "frontend" }, { name: "tanstack" }],
  },
} satisfies Story;
