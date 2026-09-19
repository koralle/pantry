import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { useState } from "react";
import { styled } from "styled-system/jsx";

import type { ShellTag } from "../lib/shell-nav";
import { AppShell } from "./app-shell";

const demoTags: ShellTag[] = [
  { count: 34, id: "1", name: "frontend" },
  { count: 18, id: "2", name: "tanstack" },
  { count: 12, id: "3", name: "db" },
  { count: 9, id: "4", name: "auth" },
  { count: 7, id: "5", name: "design" },
  { count: 11, id: "6", name: "infra" },
];

const meta = {
  component: AppShell,
  parameters: { layout: "fullscreen" },
  title: "Features / AppShell",
} satisfies Meta<typeof AppShell>;

export default meta;

type Story = StoryObj<typeof meta>;

const Placeholder = styled("div", {
  base: {
    color: "fg.faint",
    display: "grid",
    fontSize: "sm",
    padding: "6",
    placeItems: "center",
  },
});

const ShellDemo = (props: Partial<Parameters<typeof AppShell>[0]>) => {
  const [value, setValue] = useState("");
  return (
    <AppShell
      onSearchChange={setValue}
      onSearchSubmit={() => {}}
      searchValue={value}
      view="recent"
      {...props}
    >
      <Placeholder>ここに画面コンテンツ</Placeholder>
    </AppShell>
  );
};

export const Desktop = {
  args: {
    children: null,
    onSearchChange: () => {},
    onSearchSubmit: () => {},
    searchValue: "",
    view: "recent",
  },
  render: () => (
    <ShellDemo
      counts={{ favorites: 6, inbox: 3, recent: 128 }}
      tags={demoTags}
    />
  ),
} as const satisfies Story;

export const TagSelected = {
  args: Desktop.args,
  render: () => (
    <ShellDemo
      activeTagId="2"
      counts={{ favorites: 6, inbox: 3, recent: 128 }}
      tags={demoTags}
    />
  ),
} as const satisfies Story;

export const TagsView = {
  args: Desktop.args,
  render: () => (
    <ShellDemo
      counts={{ favorites: 6, inbox: 3, recent: 128 }}
      tags={demoTags}
      view="tags"
    />
  ),
} as const satisfies Story;

export const AccountView = {
  args: Desktop.args,
  render: () => <ShellDemo view="account" />,
} as const satisfies Story;

export const NoTags = {
  args: Desktop.args,
  render: () => <ShellDemo counts={{ recent: 0 }} />,
} as const satisfies Story;

export const Mobile = {
  args: Desktop.args,
  parameters: {
    viewport: { defaultViewport: "iphone12" },
  },
  render: () => (
    <ShellDemo
      counts={{ favorites: 6, inbox: 3, recent: 128 }}
      tags={demoTags}
    />
  ),
} as const satisfies Story;
