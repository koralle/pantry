import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { BookmarkX, CircleAlert, Inbox, SearchX } from "lucide-react";
import { styled } from "styled-system/jsx";

import { StyledButton } from "../styled-button";
import { StateView } from "./";

const meta = {
  component: StateView,
  parameters: { layout: "fullscreen" },
  title: "Components / StateView",
} satisfies Meta<typeof StateView>;

export default meta;

type Story = StoryObj<typeof meta>;

const Center = styled("div", {
  base: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    minBlockSize: "[100svb]",
    minInlineSize: "[100svi]",
  },
});

export const Empty = {
  args: { title: "まだブックマークがありません" },
  render: () => (
    <Center>
      <StateView
        icon={Inbox}
        title="まだブックマークがありません"
        description="URL を登録するとここに表示されます"
        action={
          <StyledButton visual="accent" size="sm">
            追加する
          </StyledButton>
        }
      />
    </Center>
  ),
} as const satisfies Story;

export const SearchEmpty = {
  args: { title: "見つかりませんでした" },
  render: () => (
    <Center>
      <StateView
        icon={SearchX}
        title="見つかりませんでした"
        description="検索条件を変えてみてください"
      />
    </Center>
  ),
} as const satisfies Story;

export const ErrorState = {
  args: { title: "読み込みに失敗しました" },
  render: () => (
    <Center>
      <StateView
        icon={CircleAlert}
        tone="danger"
        title="読み込みに失敗しました"
        description="時間をおいて再度お試しください"
        action={<StyledButton size="sm">再試行</StyledButton>}
      />
    </Center>
  ),
} as const satisfies Story;

export const NotFound = {
  args: { title: "このブックマークは存在しません" },
  render: () => (
    <Center>
      <StateView
        icon={BookmarkX}
        title="このブックマークは存在しません"
        description="削除されたか、URL が間違っています"
        action={<StyledButton size="sm">一覧へ戻る</StyledButton>}
      />
    </Center>
  ),
} as const satisfies Story;
