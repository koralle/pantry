import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { Settings } from "lucide-react";
import { styled } from "styled-system/jsx";

import { StyledButton } from "./";

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
      options: ["default", "accent", "danger", "toggle", "chip"],
    },
  },
  component: StyledButton,
  parameters: {
    layout: "fullscreen",
  },
  title: "Components / StyledButton",
} satisfies Meta<typeof StyledButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  args: {
    size: "md",
    visual: "default",
  },
  render: (args) => <StyledButton {...args}>キャンセル</StyledButton>,
} as const satisfies Story;

export const Accent = {
  args: {
    size: "md",
    visual: "accent",
  },
  render: (args) => <StyledButton {...args}>保存</StyledButton>,
} as const satisfies Story;

export const Danger = {
  args: {
    size: "md",
    visual: "danger",
  },
  render: (args) => <StyledButton {...args}>削除</StyledButton>,
} as const satisfies Story;

export const Toggle = {
  args: {
    "aria-pressed": true,
    size: "md",
    visual: "toggle",
  },
  render: (args) => <StyledButton {...args}>AND</StyledButton>,
} as const satisfies Story;

export const Chip = {
  args: {
    size: "md",
    visual: "chip",
  },
  render: (args) => (
    <StyledButton {...args}>
      reading
      <Settings size={14} aria-hidden />
    </StyledButton>
  ),
} as const satisfies Story;

export const Sizes = {
  args: {
    visual: "accent",
  },
  render: (args) => (
    <styled.div
      minInlineSize="[100svi]"
      minBlockSize="[100svb]"
      display="flex"
      alignItems="center"
      justifyContent="center"
      gap="4"
      flexWrap="wrap"
    >
      <StyledButton {...args} size="xs">
        xs
      </StyledButton>
      <StyledButton {...args} size="sm">
        sm
      </StyledButton>
      <StyledButton {...args} size="md">
        md
      </StyledButton>
      <StyledButton {...args} size="lg">
        lg
      </StyledButton>
    </styled.div>
  ),
} as const satisfies Story;

export const VisualMatrix = {
  render: () => (
    <styled.div
      minInlineSize="[100svi]"
      minBlockSize="[100svb]"
      display="grid"
      placeContent="center"
      gap="4"
    >
      <styled.div display="flex" gap="3" flexWrap="wrap">
        <StyledButton visual="default" size="sm">
          default / sm
        </StyledButton>
        <StyledButton visual="accent" size="sm">
          accent / sm
        </StyledButton>
        <StyledButton visual="danger" size="sm">
          danger / sm
        </StyledButton>
        <StyledButton visual="toggle" size="sm" aria-pressed>
          toggle / sm
        </StyledButton>
        <StyledButton visual="chip" size="sm">
          chip / sm
        </StyledButton>
      </styled.div>
      <styled.div display="flex" gap="3" flexWrap="wrap">
        <StyledButton visual="default" size="md">
          default / md
        </StyledButton>
        <StyledButton visual="accent" size="md">
          accent / md
        </StyledButton>
        <StyledButton visual="danger" size="md">
          danger / md
        </StyledButton>
        <StyledButton visual="toggle" size="md" aria-pressed>
          toggle / md
        </StyledButton>
        <StyledButton visual="chip" size="md">
          chip / md
        </StyledButton>
      </styled.div>
      <styled.div display="flex" gap="3" flexWrap="wrap">
        <StyledButton visual="default" size="lg">
          default / lg
        </StyledButton>
        <StyledButton visual="accent" size="lg">
          accent / lg
        </StyledButton>
        <StyledButton visual="danger" size="lg">
          danger / lg
        </StyledButton>
        <StyledButton visual="toggle" size="lg" aria-pressed>
          toggle / lg
        </StyledButton>
        <StyledButton visual="chip" size="lg">
          chip / lg
        </StyledButton>
      </styled.div>
    </styled.div>
  ),
} as const satisfies Story;

export const WithIcon = {
  args: {
    size: "md",
    visual: "default",
  },
  render: (args) => (
    <styled.div
      minInlineSize="[100svi]"
      minBlockSize="[100svb]"
      display="grid"
      placeContent="center"
    >
      <StyledButton {...args}>
        <Settings size={16} aria-hidden />
        設定
      </StyledButton>
    </styled.div>
  ),
} as const satisfies Story;
