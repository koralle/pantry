import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  createRoute,
} from "@tanstack/react-router";
import { expect, userEvent, waitFor, within } from "storybook/test";

import type { BookmarkListItem } from "../../features/bookmarks/persistence/list-bookmarks";
import type { BookmarkSearchSchema } from "../../features/navigation/lib/bookmark-search";
import type { ShelfTag } from "../../features/tags/lib/tag-shelf";
import preview from "../../storybook/preview";
import { Route as ProtectedLayoutRoute } from "../_protected";
import { Route as ListFileRoute } from "./bookmarks/index";

const storyQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

interface ListFixtureInput {
  readonly cursor?: string | undefined;
}

type ListFixture = (
  input: ListFixtureInput
) =>
  | { items: BookmarkListItem[]; nextCursor: string | null }
  | Promise<{ items: BookmarkListItem[]; nextCursor: string | null }>
  | Promise<never>;

let listFixture: ListFixture;
let shelfFixture: () => ShelfTag[] | Promise<ShelfTag[]>;
let countsFixture: () => {
  favorites: number;
  inbox: number;
  recent: number;
};

type StoryRpcHandler = (input: unknown) => unknown;

// rpc/client.ts は fetch を呼び出し毎に解決するので、ここで差し替えた
// global fetch がそのまま拾われる。oRPC の wire format（{json} envelope）に
// 合わせて fixture を返し、実際の link codec 経路ごと検証する。
const storyRpcHandlers = new Map<string, StoryRpcHandler>([
  [
    "bookmarks.list",
    (input) =>
      listFixture({
        cursor: (input as ListFixtureInput | undefined)?.cursor,
      }),
  ],
  ["bookmarks.counts", () => countsFixture()],
  ["tags.shelf", () => shelfFixture()],
  ["tags.touch", () => null],
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
  let procedureInput: unknown;
  const dataParam = url.searchParams.get("data");
  if (input instanceof Request) {
    const body = await input.clone().text();
    if (body !== "") {
      procedureInput = (JSON.parse(body) as { json?: unknown }).json;
    }
  } else if (typeof init?.body === "string") {
    procedureInput = (JSON.parse(init.body) as { json?: unknown }).json;
  } else if (dataParam !== null) {
    procedureInput = (JSON.parse(dataParam) as { json?: unknown }).json;
  }
  try {
    return Response.json({ json: await handler(procedureInput) });
  } catch (error) {
    // oRPC のエラー形式で返すと、fixture が投げた message が
    // ORPCError.message として画面まで届く。
    return Response.json(
      {
        json: {
          code: "INTERNAL_SERVER_ERROR",
          defined: false,
          message:
            error instanceof Error ? error.message : "Internal Server Error",
          status: 500,
        },
      },
      { status: 500 }
    );
  }
};

function StoryRoot() {
  return (
    <QueryClientProvider client={storyQueryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}

// Storybook's createFileRoute mock treats `/_protected/` as a pathless layout
// (last segment is `_protected`), so binding that file Route duplicates id
// `/_protected/`. Rebuild the layout + index as an explicit pathful tree.
const storyRoot = createRootRouteWithContext<{
  readonly queryClient: QueryClient;
}>()({
  component: StoryRoot,
});

const storyProtectedLayout = createRoute({
  id: "/_protected",
  getParentRoute: () => storyRoot,
  beforeLoad: () => ({
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    },
  }),
  loader: async () => ({
    shelfTagsPromise: Promise.resolve(shelfTags),
  }),
  component: ProtectedLayoutRoute.options.component!,
});

// 実ルート木（bookmarks/index.tsx が `/_protected/bookmarks/` の index
// ルート）と同じ id 体系になるよう、中間ルート + index 子で組み立てる。
// レイアウトの useSearch({from: "/_protected/bookmarks/"}) がここを引くため。
const storyBookmarksRoute = createRoute({
  getParentRoute: () => storyProtectedLayout as never,
  path: "/bookmarks",
});

const storyListRoute = createRoute({
  getParentRoute: () => storyBookmarksRoute as never,
  path: "/",
  validateSearch: ListFileRoute.options.validateSearch!,
  loaderDeps: ListFileRoute.options.loaderDeps!,
  loader: ListFileRoute.options.loader!,
  component: ListFileRoute.options.component!,
});

// 行リンクの `to="/bookmarks/$id"` が params を展開できるよう、
// 実ルート相当の stub を木に登録しておく。
const storyDetailParentRoute = createRoute({
  getParentRoute: () => storyBookmarksRoute as never,
  path: "$id",
});

const storyDetailRoute = createRoute({
  getParentRoute: () => storyDetailParentRoute as never,
  path: "/",
  component: () => null,
});

storyBookmarksRoute.addChildren([
  storyListRoute,
  storyDetailParentRoute,
] as never);
storyDetailParentRoute.addChildren([storyDetailRoute] as never);
storyProtectedLayout.addChildren([storyBookmarksRoute] as never);
storyRoot.addChildren([storyProtectedLayout]);

const now = new Date("2026-08-01T03:00:00.000Z");
const later = new Date("2026-08-10T06:30:00.000Z");

const session = {
  user: {
    id: "user-1",
    email: "koralle@example.com",
    name: "koralle",
    image: null,
    emailVerified: true,
    banned: false,
    createdAt: now,
    updatedAt: now,
  },
  session: {
    id: "session-1",
    userId: "user-1",
    token: "story-token",
    expiresAt: new Date("2026-09-01T00:00:00.000Z"),
    createdAt: now,
    updatedAt: now,
  },
};

const shelfTags: ShelfTag[] = [
  {
    id: 1,
    name: "reading",
    pinned: true,
    sortOrder: 0,
    color: "#c45c26",
    lastUsedAt: now,
    bookmarkCount: 12,
  },
  {
    id: 2,
    name: "work",
    pinned: true,
    sortOrder: 1,
    color: "#2f6fed",
    lastUsedAt: later,
    bookmarkCount: 8,
  },
  {
    id: 3,
    name: "typescript",
    pinned: false,
    sortOrder: 0,
    color: null,
    lastUsedAt: now,
    bookmarkCount: 5,
  },
  {
    id: 4,
    name: "cloudflare",
    pinned: false,
    sortOrder: 1,
    color: "#f6821f",
    lastUsedAt: null,
    bookmarkCount: 3,
  },
  {
    id: 5,
    name: "recipe",
    pinned: false,
    sortOrder: 2,
    color: null,
    lastUsedAt: null,
    bookmarkCount: 1,
  },
];

function makeBookmark(
  bookmark: Pick<BookmarkListItem, "id" | "title" | "url"> &
    Partial<BookmarkListItem>
): BookmarkListItem {
  return {
    createdAt: now.toISOString(),
    favorite: false,
    note: null,
    updatedAt: now.toISOString(),
    tags: [],
    ...bookmark,
  };
}

const shortBookmark = makeBookmark({
  id: "019fae92-3bb0-78cd-b488-65ce0e26a001",
  title: "短いタイトル",
  url: "https://example.com/short",
});

const longBookmark = makeBookmark({
  id: "019fae92-3bb0-78cd-b488-65ce0e26a002",
  title:
    "2020年版: なぜ仮想 DOM / 宣言的 UI という概念が、あのときの俺達の魂を震えさせたのか",
  url: "https://zenn.dev/mizchi/books/0c55c230f5cc754c38b9",
  note: "当時の空気感と、今のコンポーネント設計を見比べるためのメモ。",
  updatedAt: later.toISOString(),
  tags: [
    { color: null, id: 1, name: "reading" },
    { color: null, id: 2, name: "work" },
    { color: null, id: 3, name: "typescript" },
    { color: null, id: 4, name: "cloudflare" },
  ],
});

const reactBookmark = makeBookmark({
  id: "019fae92-3bb0-78cd-b488-65ce0e26a003",
  title: "React 19 の use()",
  url: "https://react.dev/reference/react/use",
  tags: [{ color: null, id: 3, name: "typescript" }],
});

const noteOnlyBookmark = makeBookmark({
  id: "019fae92-3bb0-78cd-b488-65ce0e26a004",
  title: "メモ付きの記事",
  url: "https://example.com/notes",
  note: "タグなし。本文だけ残している。",
});

const bookmarks = [
  shortBookmark,
  longBookmark,
  reactBookmark,
  noteOnlyBookmark,
];
const firstPage = [shortBookmark, longBookmark];
const nextPage = [reactBookmark, noteOnlyBookmark];
const nextCursor = "story-next-page";

async function neverPromise<T>(): Promise<T> {
  return await new Promise(() => {});
}

function stubListApis() {
  storyQueryClient.clear();
  listFixture = () => ({ items: bookmarks, nextCursor: null });
  shelfFixture = () => shelfTags;
  countsFixture = () => ({ favorites: 1, inbox: 2, recent: 4 });
}

function stubPagedBookmarks(
  next: BookmarkListItem[] | Promise<BookmarkListItem[]> | Error
) {
  listFixture = (input) => {
    if (input.cursor == null) {
      return { items: firstPage, nextCursor };
    }
    if (next instanceof Error) {
      return Promise.reject(next);
    }
    return Promise.resolve(next).then((items) => ({ items, nextCursor: null }));
  };
}

// 行リンクの accessible name はタイトル＋ドメイン＋メタの複合なので、
// name 照合はエスケープ済みの部分一致 regex で行う。
const rowLinkName = (title: string) =>
  new RegExp(title.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&"));

function listQuery(query: Partial<BookmarkSearchSchema>) {
  return {
    tanstack: {
      router: {
        route: storyListRoute,
        path: "/bookmarks" as const,
        query,
        context: {
          queryClient: storyQueryClient,
        },
      },
    },
  };
}

const meta = preview.meta({
  title: "Pages / ブックマーク一覧画面",
  parameters: {
    layout: "fullscreen",
    viewport: {
      defaultViewport: "desktop",
      options: {
        desktop: {
          name: "Desktop",
          styles: { height: "800px", width: "1280px" },
          type: "desktop",
        },
      },
    },
    tanstack: {
      router: {
        route: storyListRoute,
        path: "/bookmarks" as const,
        context: {
          queryClient: storyQueryClient,
        },
      },
    },
  },
  beforeEach: async () => {
    stubListApis();
  },
});

export const Default = meta.story({
  name: "既定",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByRole("link", { name: rowLinkName(shortBookmark.title) })
      ).toBeInTheDocument();
    });
    await expect(
      canvas.getByRole("heading", { name: "最近保存したもの" })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: rowLinkName(longBookmark.title) })
    ).toBeInTheDocument();
    await expect(
      canvas.getByPlaceholderText("検索、タグ名、URLをそのまま入力…")
    ).toBeInTheDocument();
    await expect(
      canvas.queryByRole("button", { name: "もっと見る" })
    ).not.toBeInTheDocument();
  },
});

export const Empty = meta.story({
  name: "空",
  beforeEach: async () => {
    listFixture = () => ({ items: [], nextCursor: null });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByText("まだブックマークがありません")
      ).toBeInTheDocument();
    });
    await expect(
      canvas.getByRole("link", { name: "最初の1件を登録" })
    ).toBeInTheDocument();
  },
});

export const EmptyBySearch = meta.story({
  name: "検索条件で空",
  parameters: listQuery({ q: "存在しないキーワード" }),
  beforeEach: async () => {
    listFixture = () => ({ items: [], nextCursor: null });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // 見出しはローディング中にも出るので、ロード後にしか出ない要素を待つ
    await waitFor(async () => {
      await expect(
        canvas.getByText("条件に合うブックマークがありません")
      ).toBeInTheDocument();
    });
    await expect(
      canvas.getByRole("heading", {
        name: "「存在しないキーワード」の検索結果",
      })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: "条件をクリア" })
    ).toBeInTheDocument();
    await expect(
      canvas.getByPlaceholderText("検索、タグ名、URLをそのまま入力…")
    ).toHaveValue("存在しないキーワード");
  },
});

export const EmptyByTags = meta.story({
  name: "タグ条件で空",
  parameters: listQuery({ tags: ["reading"] }),
  beforeEach: async () => {
    listFixture = () => ({ items: [], nextCursor: null });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // 一覧とレールは別々の Suspense 境界で解決するので両方を待つ
    await waitFor(async () => {
      await expect(
        canvas.getByText("条件に合うブックマークがありません")
      ).toBeInTheDocument();
      await expect(
        canvas.getByRole("link", { name: "reading 12" })
      ).toHaveAttribute("aria-current", "true");
    });
    await expect(
      canvas.getByRole("heading", { name: "reading" })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: "条件をクリア" })
    ).toBeInTheDocument();
  },
});

export const SearchResults = meta.story({
  name: "検索結果",
  parameters: listQuery({ q: "React" }),
  beforeEach: async () => {
    listFixture = () => ({ items: [reactBookmark], nextCursor: null });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByRole("link", { name: rowLinkName(reactBookmark.title) })
      ).toBeInTheDocument();
    });
    await expect(
      canvas.getByRole("heading", { name: "「React」の検索結果" })
    ).toBeInTheDocument();
    await expect(
      canvas.queryByRole("link", { name: rowLinkName(shortBookmark.title) })
    ).not.toBeInTheDocument();
  },
});

export const TagFilterAnd = meta.story({
  name: "タグAND絞り込み",
  parameters: listQuery({ tags: ["reading", "work"], tagMode: "and" }),
  beforeEach: async () => {
    listFixture = () => ({ items: [longBookmark], nextCursor: null });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByRole("link", { name: rowLinkName(longBookmark.title) })
      ).toBeInTheDocument();
    });
    await expect(
      canvas.getByRole("heading", { name: "reading / work" })
    ).toBeInTheDocument();
  },
});

export const TagFilterOr = meta.story({
  name: "タグOR絞り込み",
  parameters: listQuery({ tags: ["reading"], tagMode: "or" }),
  beforeEach: async () => {
    listFixture = () => ({ items: [longBookmark], nextCursor: null });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByRole("link", { name: rowLinkName(longBookmark.title) })
      ).toBeInTheDocument();
    });
    await expect(
      canvas.getByRole("heading", { name: "reading" })
    ).toBeInTheDocument();
  },
});

export const SortUpdated = meta.story({
  name: "並び替え",
  parameters: listQuery({ sort: "updated" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByRole("link", { name: rowLinkName(shortBookmark.title) })
      ).toBeInTheDocument();
    });
    await expect(
      canvas.getByRole("heading", { name: "最近保存したもの" })
    ).toBeInTheDocument();
  },
});

export const InitialLoading = meta.story({
  name: "初回読み込み中",
  beforeEach: async () => {
    listFixture = async () => await neverPromise();
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByRole("heading", { name: "最近保存したもの" })
      ).toBeInTheDocument();
    });
    await expect(canvas.getAllByText("読み込み中…")).toHaveLength(1);
    await expect(
      canvas.queryByRole("link", { name: rowLinkName(shortBookmark.title) })
    ).not.toBeInTheDocument();
    const skeletonList = canvasElement.querySelector(
      '[data-testid="rows-skeleton"]'
    );
    await expect(skeletonList).not.toBeNull();
    await expect(skeletonList).toHaveAttribute("aria-hidden", "true");
    await expect(skeletonList?.children).toHaveLength(5);
  },
});

export const LoadError = meta.story({
  name: "読み込みエラー",
  beforeEach: async () => {
    listFixture = async () => {
      throw new Error("一覧の読み込みに失敗しました");
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(canvas.getByRole("alert")).toHaveTextContent(
        "読み込みに失敗しました"
      );
    });
    await expect(
      canvas.getByRole("button", { name: "再試行" })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: "一覧へ戻る" })
    ).toBeInTheDocument();
  },
});

export const HasMore = meta.story({
  name: "続きあり",
  beforeEach: async () => {
    stubPagedBookmarks(nextPage);
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByRole("link", { name: rowLinkName(shortBookmark.title) })
      ).toBeInTheDocument();
    });
    await expect(
      canvas.getByRole("button", { name: "もっと見る" })
    ).toBeEnabled();
    await expect(
      canvas.queryByRole("link", { name: rowLinkName(reactBookmark.title) })
    ).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "もっと見る" }));
    await waitFor(async () => {
      await expect(
        canvas.getByRole("link", { name: rowLinkName(reactBookmark.title) })
      ).toBeInTheDocument();
    });
    await expect(
      canvas.getByRole("link", { name: rowLinkName(shortBookmark.title) })
    ).toBeInTheDocument();
    await expect(
      canvas.queryByRole("button", { name: "もっと見る" })
    ).not.toBeInTheDocument();
  },
});

export const LoadingMore = meta.story({
  name: "追加読み込み中",
  beforeEach: async () => {
    stubPagedBookmarks(neverPromise());
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByRole("button", { name: "もっと見る" })
      ).toBeEnabled();
    });
    await userEvent.click(canvas.getByRole("button", { name: "もっと見る" }));
    await waitFor(async () => {
      await expect(
        canvas.getByRole("button", { name: "読み込み中…" })
      ).toBeDisabled();
    });
  },
});

export const LoadMoreError = meta.story({
  name: "追加読み込みエラー",
  beforeEach: async () => {
    stubPagedBookmarks(new Error("続きの読み込みに失敗しました"));
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByRole("button", { name: "もっと見る" })
      ).toBeEnabled();
    });
    await userEvent.click(canvas.getByRole("button", { name: "もっと見る" }));
    await waitFor(async () => {
      await expect(canvas.getByRole("alert")).toHaveTextContent(
        "続きの読み込みに失敗しました"
      );
    });
    await expect(
      canvas.getByRole("button", { name: "再試行" })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: rowLinkName(shortBookmark.title) })
    ).toBeInTheDocument();
  },
});

export const NoShelfTags = meta.story({
  name: "シェルフタグなし",
  beforeEach: async () => {
    shelfFixture = () => [];
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByRole("link", { name: rowLinkName(shortBookmark.title) })
      ).toBeInTheDocument();
    });
    const rail = canvas.getByRole("navigation", { name: "ビュー" });
    await expect(
      within(rail).queryByRole("link", { name: /reading/ })
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: rowLinkName(shortBookmark.title) })
    ).toBeInTheDocument();
  },
});
