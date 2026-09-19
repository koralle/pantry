import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { styled } from "styled-system/jsx";

import { DOMAIN_TONES } from "../../../styles/domain-tone";
import { FaviconTile } from "./";

const meta = {
  args: {
    domain: "zenn.dev",
    failed: false,
    size: "sm",
  },
  argTypes: {
    failed: { control: { type: "boolean" } },
    size: {
      control: { type: "select" },
      options: ["sm", "lg"],
    },
  },
  component: FaviconTile,
  parameters: { layout: "fullscreen" },
  title: "Components / FaviconTile",
} satisfies Meta<typeof FaviconTile>;

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
  render: (args) => (
    <Center>
      <FaviconTile {...args} />
    </Center>
  ),
} as const satisfies Story;

export const AllTones = {
  args: { domain: "zenn.dev" },
  render: () => (
    <Center columnGap="3">
      {DOMAIN_TONES.map((tone) => (
        <FaviconTile key={tone} domain={tone} tone={tone} />
      ))}
    </Center>
  ),
} as const satisfies Story;

export const Sizes = {
  args: { domain: "zenn.dev" },
  render: () => (
    <Center columnGap="3">
      <FaviconTile domain="zenn.dev" size="sm" />
      <FaviconTile domain="zenn.dev" size="lg" />
    </Center>
  ),
} as const satisfies Story;

export const FetchFailed = {
  args: { domain: "broken.example" },
  render: () => (
    <Center columnGap="3">
      <FaviconTile domain="broken.example" failed size="sm" />
      <FaviconTile domain="broken.example" failed size="lg" />
    </Center>
  ),
} as const satisfies Story;
