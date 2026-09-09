import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { Settings } from "lucide-react";
import { styled } from "styled-system/jsx";

import { StyledLink } from "./";

const meta = {
  argTypes: {
    size: {
      control: {
        type: "select",
      },
      options: ["xs", "sm", "md", "lg"],
    },
    visual: {
      control: {
        type: "select",
      },
      options: ["plain", "accent", "muted", "brand"],
    },
  },
  component: StyledLink,
  parameters: {
    layout: "fullscreen",
  },
  title: "Components / StyledLink",
} satisfies Meta<typeof StyledLink>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  args: {
    size: "md",
    to: "/bookmarks",
    visual: "plain",
  },
  render: (args) => <StyledLink {...args}>設定</StyledLink>,
} as const satisfies Story;

export const Accent = {
  args: {
    to: "/bookmarks",
    visual: "accent",
  },
  render: (args) => <StyledLink {...args}>戻る</StyledLink>,
} as const satisfies Story;

export const Muted = {
  args: {
    to: "/bookmarks",
    visual: "muted",
  },
  render: (args) => <StyledLink {...args}>example.com</StyledLink>,
} as const satisfies Story;

export const Brand = {
  args: {
    to: "/bookmarks",
    visual: "brand",
  },
  render: (args) => <StyledLink {...args}>Pantry</StyledLink>,
} as const satisfies Story;

export const WithIcon = {
  args: {
    to: "/settings",
    visual: "plain",
  },
  render: (args) => (
    <styled.div
      minInlineSize="[100svi]"
      minBlockSize="[100svb]"
      display="grid"
      placeContent="center"
    >
      <StyledLink {...args}>
        <Settings size={16} aria-hidden />
        設定
      </StyledLink>
    </styled.div>
  ),
} as const satisfies Story;
