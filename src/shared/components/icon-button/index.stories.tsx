import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { ExternalLink, Trash2, X } from "lucide-react";
import { styled } from "styled-system/jsx";

import { IconButton } from "./";

const meta = {
  argTypes: {
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
    },
    tone: {
      control: { type: "select" },
      options: ["default", "danger"],
    },
  },
  component: IconButton,
  parameters: { layout: "fullscreen" },
  title: "Components / IconButton",
} satisfies Meta<typeof IconButton>;

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

export const Default = {
  name: "既定",
  args: { "aria-label": "開く", size: "md", tone: "default" },
  render: (args) => (
    <Center>
      <IconButton {...args} aria-label="開く">
        <ExternalLink size={16} aria-hidden />
      </IconButton>
    </Center>
  ),
} as const satisfies Story;

export const Sizes = {
  name: "サイズ",
  args: { "aria-label": "開く" },
  render: () => (
    <Center columnGap="2">
      <IconButton size="sm" aria-label="開く">
        <ExternalLink size={14} aria-hidden />
      </IconButton>
      <IconButton size="md" aria-label="開く">
        <ExternalLink size={16} aria-hidden />
      </IconButton>
      <IconButton size="lg" aria-label="開く">
        <ExternalLink size={18} aria-hidden />
      </IconButton>
    </Center>
  ),
} as const satisfies Story;

export const Danger = {
  name: "危険",
  args: { "aria-label": "削除" },
  render: () => (
    <Center columnGap="2">
      <IconButton tone="danger" aria-label="削除">
        <Trash2 size={16} aria-hidden />
      </IconButton>
      <IconButton aria-label="閉じる">
        <X size={16} aria-hidden />
      </IconButton>
    </Center>
  ),
} as const satisfies Story;

export const Disabled = {
  name: "無効",
  args: { "aria-label": "開く" },
  render: () => (
    <Center>
      <IconButton isDisabled aria-label="開く">
        <ExternalLink size={16} aria-hidden />
      </IconButton>
    </Center>
  ),
} as const satisfies Story;
