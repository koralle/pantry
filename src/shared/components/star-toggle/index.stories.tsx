import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { styled } from "styled-system/jsx";

import { StarToggle } from "./";

const meta = {
  argTypes: {
    pressed: { control: { type: "boolean" } },
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
    },
  },
  component: StarToggle,
  parameters: { layout: "fullscreen" },
  title: "Components / StarToggle",
} satisfies Meta<typeof StarToggle>;

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

export const Off = {
  args: { pressed: false, size: "md" },
  render: (args) => (
    <Center>
      <StarToggle {...args} />
    </Center>
  ),
} as const satisfies Story;

export const On = {
  args: { pressed: true, size: "md" },
  render: (args) => (
    <Center>
      <StarToggle {...args} />
    </Center>
  ),
} as const satisfies Story;

export const Sizes = {
  args: { pressed: true },
  render: () => (
    <Center columnGap="2">
      <StarToggle pressed size="sm" />
      <StarToggle pressed size="md" />
      <StarToggle pressed size="lg" />
    </Center>
  ),
} as const satisfies Story;
