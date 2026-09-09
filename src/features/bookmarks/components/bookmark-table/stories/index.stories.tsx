import { Outlet, createRootRoute, createRoute } from "@tanstack/react-router";
import { css } from "styled-system/css";

import { BookmarkTable } from "..";
import preview from "../../../../../storybook/preview";
import { reactBookmark } from "./fixtures/bookmark-detail-data";
import { bookmarks } from "./fixtures/bookmark-list-data";

function StoryRoot() {
  return <Outlet />;
}

const storyRootRoute = createRootRoute({ component: StoryRoot });

const storyListRoute = createRoute({
  getParentRoute: () => storyRootRoute,
  path: "/",
});

// BookmarkTable 内の Link (to="/bookmarks/$id") を解決するための受け皿。
const storyDetailRoute = createRoute({
  getParentRoute: () => storyRootRoute,
  path: "/bookmarks/$id",
  component: () => null,
});

storyRootRoute.addChildren([storyListRoute, storyDetailRoute]);

const meta = preview.meta({
  component: BookmarkTable,
  title: "Components / BookmarkTable",
  parameters: {
    layout: "fullscreen",
    tanstack: {
      router: {
        route: storyListRoute,
        path: "/",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className={css({ paddingInline: 6 })}>
        <Story />
      </div>
    ),
  ],
});

export const Default = meta.story({
  args: {
    bookmarks,
  },
});

export const LongContent = meta.story({
  args: {
    bookmarks,
  },
});

export const WithDetailSearch = meta.story({
  args: {
    bookmarks: [reactBookmark],
    detailSearch: { q: "React", tagMode: "and", tags: ["typescript"] },
  },
});

export const Empty = meta.story({
  args: {
    bookmarks: [],
  },
});
