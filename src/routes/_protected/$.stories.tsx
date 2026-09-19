import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  createRoute,
  Outlet,
} from "@tanstack/react-router";
import { expect, waitFor, within } from "storybook/test";

import type { ShelfTag } from "../../features/tags/lib/tag-shelf";
import preview from "../../storybook/preview";
import { Route as ProtectedLayoutRoute } from "../_protected";
import { Route as SplatFileRoute } from "./$";

const storyQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const shelfTags: ShelfTag[] = [];

// タグ管理 story と同じく oRPC wire format（{json} envelope）で応答する。
const storyRpcHandlers = new Map<string, () => unknown>([
  ["bookmarks.counts", () => ({ favorites: 6, inbox: 3, recent: 128 })],
  ["bookmarks.list", () => ({ items: [], nextCursor: null })],
  ["tags.shelf", () => shelfTags],
]);

const storyOriginalFetch = globalThis.fetch;

globalThis.fetch = async (input, init) => {
  const requestUrl =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  const url = new URL(requestUrl, window.location.origin);
  if (!url.pathname.startsWith("/api/rpc/")) {
    return await storyOriginalFetch(input, init);
  }
  const handler = storyRpcHandlers.get(
    url.pathname.slice("/api/rpc/".length).replaceAll("/", ".")
  );
  if (handler === undefined) {
    return new Response(null, { status: 404 });
  }
  return Response.json({ json: handler() });
};

const storyUser = {
  id: "user-1",
  name: "koralle",
  email: "koralle@example.com",
};

function StoryRoot() {
  return (
    <QueryClientProvider client={storyQueryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}

const storyRoot = createRootRouteWithContext<{
  readonly queryClient: QueryClient;
}>()({
  component: StoryRoot,
});

const storyProtectedLayout = createRoute({
  id: "/_protected",
  getParentRoute: () => storyRoot,
  beforeLoad: () => ({ user: storyUser }),
  loader: async () => ({
    countsPromise: Promise.resolve({ favorites: 6, inbox: 3, recent: 128 }),
    shelfTagsPromise: Promise.resolve(shelfTags),
  }),
  component: ProtectedLayoutRoute.options.component!,
});

const storySplatRoute = createRoute({
  component: SplatFileRoute.options.component!,
  getParentRoute: () => storyProtectedLayout as never,
  path: "$",
});

// 404 内の `一覧へ戻る` リンクが解決できるよう一覧ルートを stub する。
const storyBookmarksRoute = createRoute({
  getParentRoute: () => storyProtectedLayout as never,
  path: "/bookmarks",
});

const storyBookmarksIndexRoute = createRoute({
  component: () => null,
  getParentRoute: () => storyBookmarksRoute as never,
  path: "/",
});

storyBookmarksRoute.addChildren([storyBookmarksIndexRoute] as never);
storyProtectedLayout.addChildren([
  storySplatRoute,
  storyBookmarksRoute,
] as never);
storyRoot.addChildren([storyProtectedLayout]);

const meta = preview.meta({
  parameters: {
    layout: "fullscreen",
    tanstack: {
      router: {
        context: {
          queryClient: storyQueryClient,
        },
        path: "/missing-page" as never,
        route: storySplatRoute as never,
      },
    },
  },
  title: "Pages / 404",
  beforeEach: async () => {
    await storyQueryClient.clear();
  },
});

export const InShell = meta.story({
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByText("ページが見つかりません")
      ).toBeInTheDocument();
    });
    await expect(canvas.getByText("404")).toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: /一覧へ戻る/ })
    ).toBeInTheDocument();
    // シェルは残る（トップバーの検索欄が見える）
    await expect(
      canvas.getByPlaceholderText(/検索、タグ名/)
    ).toBeInTheDocument();
  },
});

export const Mobile = meta.story({
  globals: {
    viewport: {
      value: "iphone12",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByText("ページが見つかりません")
      ).toBeInTheDocument();
    });
    await expect(
      canvas.getByRole("link", { name: /一覧へ戻る/ })
    ).toBeInTheDocument();
    // モバイルの検索アクションは非表示
    await expect(
      canvas.queryByRole("link", { name: "検索する" })
    ).not.toBeInTheDocument();
  },
});
