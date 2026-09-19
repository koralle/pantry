import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { styled } from "styled-system/jsx";

import { DOMAIN_TONES } from "../../../styles/domain-tone";
import { TagChip, TagDot } from "./";

const meta = {
  argTypes: {
    name: { control: { type: "text" } },
    tone: {
      control: { type: "select" },
      options: DOMAIN_TONES,
    },
  },
  component: TagChip,
  parameters: { layout: "fullscreen" },
  title: "Components / TagChip",
} satisfies Meta<typeof TagChip>;

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
  args: { name: "typescript" },
  render: (args) => (
    <Center>
      <TagChip {...args} />
    </Center>
  ),
} as const satisfies Story;

export const Row = {
  args: { name: "typescript" },
  render: () => (
    <Center columnGap="1.5">
      <TagChip name="typescript" />
      <TagChip name="react" />
      <TagChip name="design" />
      <TagChip name="あとで読む" />
    </Center>
  ),
} as const satisfies Story;

export const AllTones = {
  args: { name: "typescript" },
  render: () => (
    <Center columnGap="1.5">
      {DOMAIN_TONES.map((tone) => (
        <TagChip key={tone} name={tone} tone={tone} />
      ))}
    </Center>
  ),
} as const satisfies Story;

export const Dots = {
  args: { name: "typescript" },
  render: () => (
    <Center columnGap="2">
      {DOMAIN_TONES.map((tone) => (
        <TagDot key={tone} tone={tone} />
      ))}
    </Center>
  ),
} as const satisfies Story;
