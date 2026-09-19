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

export const Default = {} satisfies Story;

export const Selected = {
  args: { selected: true },
} satisfies Story;

export const Starred = {
  args: { starred: true },
} satisfies Story;

export const WithTags = {
  args: {
    tags: [{ name: "frontend" }, { name: "tanstack" }, { name: "design" }],
  },
} satisfies Story;

export const FaviconFailed = {
  args: { faviconFailed: true },
} satisfies Story;

export const LongTitle = {
  args: {
    tags: [{ name: "frontend" }, { name: "db" }],
    title:
      "Valibot スキーマ検証の実践パターンと移行ガイド：Zod からの段階的置き換えを試してみた記録",
  },
} satisfies Story;

export const Full = {
  args: {
    faviconFailed: true,
    selected: true,
    starred: true,
    tags: [{ name: "frontend" }, { name: "tanstack" }],
  },
} satisfies Story;
