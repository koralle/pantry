import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  createRoute,
  Outlet,
} from "@tanstack/react-router";
import { expect, userEvent, waitFor, within } from "storybook/test";

import type { ShelfTag } from "../../../features/tags/lib/tag-shelf";
import preview from "../../../storybook/preview";
import { Route as ProtectedLayoutRoute } from "../../_protected";
import { Route as TagsFileRoute } from "./index";

const storyQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

type ShelfFixture = () => ShelfTag[] | Promise<ShelfTag[]> | Promise<never>;
type CountsFixture = () => {
  favorites: number;
  inbox: number;
  recent: number;
};
type MutationFixture = (input: unknown) => unknown;

// Storybook は beforeEach より前にナビゲーション（loader）を走らせるので、
// fixture は宣言時に既定値を持たせ、story 側の beforeEach で差し替える。
let shelfFixture: ShelfFixture = () => shelfTags;
let countsFixture: CountsFixture = () => ({
  favorites: 6,
  inbox: 3,
  recent: 128,
});
let createFixture: MutationFixture = (input) => ({
  id: 99,
  name: (input as { name: string }).name,
});
let updateFixture: MutationFixture = (input) => ({
  id: (input as { id: number }).id,
});
let deleteFixture: MutationFixture = (input) => ({
  id: (input as { id: number }).id,
});

// Storybook は beforeEach より前にナビゲーション（loader）を走らせる。
// fixture を loader 時点ではなく `use()` による render 以降に評価するため、
// 解決をマイクロタスク群の後に実行されるマクロタスクへ送る。
function deferredFixturePromise<T>(read: () => T | Promise<T>) {
  return new Promise<T>((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(read());
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    }, 0);
  });
}

type StoryRpcHandler = (input: unknown) => unknown;

// rpc/client.ts は fetch を呼び出し毎に解決するので、ここで差し替えた
// global fetch がそのまま拾われる。oRPC の wire format（{json} envelope）に
// 合わせて fixture を返し、実際の link codec 経路ごと検証する。
const storyRpcHandlers = new Map<string, StoryRpcHandler>([
  ["bookmarks.counts", () => countsFixture()],
  ["bookmarks.list", () => ({ items: [], nextCursor: null })],
  ["tags.create", (input) => createFixture(input)],
  ["tags.delete", (input) => deleteFixture(input)],
  ["tags.shelf", () => shelfFixture()],
  ["tags.update", (input) => updateFixture(input)],
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
    procedureInput = (JSON.parse(init.body) as { json: unknown }).json;
  } else if (dataParam !== null) {
    procedureInput = (JSON.parse(dataParam) as { json: unknown }).json;
  }
  try {
    return Response.json({ json: await handler(procedureInput) });
  } catch (error) {
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

const now = new Date("2026-08-01T03:00:00.000Z");

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
    bookmarkCount: 34,
    color: "#3b82f6",
    id: 1,
    lastUsedAt: null,
    name: "frontend",
    pinned: false,
    sortOrder: 0,
  },
  {
    bookmarkCount: 18,
    color: "#14b8a6",
    id: 2,
    lastUsedAt: null,
    name: "tanstack",
    pinned: false,
    sortOrder: 1,
  },
  {
    bookmarkCount: 12,
    color: "#22c55e",
    id: 3,
    lastUsedAt: null,
    name: "db",
    pinned: false,
    sortOrder: 2,
  },
  {
    bookmarkCount: 11,
    color: "#eab308",
    id: 4,
    lastUsedAt: null,
    name: "infra",
    pinned: false,
    sortOrder: 3,
  },
  {
    bookmarkCount: 9,
    color: "#f97316",
    id: 5,
    lastUsedAt: null,
    name: "auth",
    pinned: false,
    sortOrder: 4,
  },
  {
    bookmarkCount: 7,
    color: "#a855f7",
    id: 6,
    lastUsedAt: null,
    name: "design",
    pinned: false,
    sortOrder: 5,
  },
];

function StoryRoot() {
  return (
    <QueryClientProvider client={storyQueryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}

// 一覧 story と同じく、pathless layout を id が一致するよう手組みする。
// 実レイアウトの component は本物を使い、beforeLoad / loader だけ差し替える。
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
    countsPromise: deferredFixturePromise(() => countsFixture()),
    shelfTagsPromise: deferredFixturePromise(() => shelfFixture()),
  }),
  component: ProtectedLayoutRoute.options.component!,
});

const storyTagsRoute = createRoute({
  getParentRoute: () => storyProtectedLayout as never,
  path: "/tags",
});

const storyTagsIndexRoute = createRoute({
  component: TagsFileRoute.options.component!,
  getParentRoute: () => storyTagsRoute as never,
  path: "/",
});

// 行リンクの `to="/bookmarks"` が解決できるよう、一覧の stub を木に登録する。
const storyBookmarksRoute = createRoute({
  getParentRoute: () => storyProtectedLayout as never,
  path: "/bookmarks",
});

const storyBookmarksIndexRoute = createRoute({
  component: () => null,
  getParentRoute: () => storyBookmarksRoute as never,
  path: "/",
});

storyTagsRoute.addChildren([storyTagsIndexRoute] as never);
storyBookmarksRoute.addChildren([storyBookmarksIndexRoute] as never);
storyProtectedLayout.addChildren([
  storyTagsRoute,
  storyBookmarksRoute,
] as never);
storyRoot.addChildren([storyProtectedLayout]);

async function neverPromise<T>(): Promise<T> {
  return await new Promise(() => {});
}

function stubTagApis() {
  shelfFixture = () => shelfTags;
  countsFixture = () => ({ favorites: 6, inbox: 3, recent: 128 });
  createFixture = (input) => ({
    id: 99,
    name: (input as { name: string }).name,
  });
  updateFixture = (input) => ({ id: (input as { id: number }).id });
  deleteFixture = (input) => ({ id: (input as { id: number }).id });
}

const meta = preview.meta({
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
        route: storyTagsIndexRoute,
        path: "/tags" as const,
        context: {
          queryClient: storyQueryClient,
        },
      },
    },
  },
  title: "Pages / タグ管理",
  beforeEach: async () => {
    stubTagApis();
    await storyQueryClient.clear();
  },
});

const railNav = (canvasElement: HTMLElement) =>
  within(canvasElement).getByRole("navigation", { name: "ビュー" });

export const Ideal = meta.story({
  name: "標準",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByRole("link", { name: /frontend/ })
      ).toBeInTheDocument();
    });
    await expect(
      canvas.getByRole("heading", { name: "タグ" })
    ).toBeInTheDocument();
    await expect(canvas.getByText("6 件")).toBeInTheDocument();
    await expect(
      canvas.getByPlaceholderText("タグを検索…")
    ).toBeInTheDocument();
    // シェルのレールで「タグ管理」が active になっている
    const rail = railNav(canvasElement);
    await waitFor(async () => {
      await expect(
        within(rail).getByRole("link", { name: "タグ管理" })
      ).toHaveAttribute("aria-current", "page");
    });
  },
});

export const SearchFilter = meta.story({
  name: "検索で絞り込み",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByRole("link", { name: /frontend/ })
      ).toBeInTheDocument();
    });
    await userEvent.type(canvas.getByPlaceholderText("タグを検索…"), "tan");
    await waitFor(async () => {
      await expect(
        canvas.getByRole("link", { name: /tanstack/ })
      ).toBeInTheDocument();
      await expect(
        canvas.queryByRole("link", { name: /frontend/ })
      ).not.toBeInTheDocument();
    });
  },
});

export const Empty = meta.story({
  name: "空",
  beforeEach: async () => {
    shelfFixture = () => [];
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByText("タグはまだありません")
      ).toBeInTheDocument();
    });
    await expect(
      canvas.getByRole("button", { name: "タグを作成" })
    ).toBeInTheDocument();
  },
});

export const InitialLoading = meta.story({
  name: "初回読み込み中",
  beforeEach: async () => {
    shelfFixture = async () => await neverPromise();
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByRole("heading", { name: "タグ" })
      ).toBeInTheDocument();
    });
    await expect(canvas.getByText("読み込み中…")).toBeInTheDocument();
    await expect(
      canvas.queryByPlaceholderText("タグを検索…")
    ).not.toBeInTheDocument();
  },
});

export const LoadError = meta.story({
  name: "読み込みエラー",
  beforeEach: async () => {
    shelfFixture = async () => {
      throw new Error("shelf boom");
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByText("読み込みに失敗しました")
      ).toBeInTheDocument();
    });
    await expect(
      canvas.getByRole("button", { name: "再試行" })
    ).toBeInTheDocument();
  },
});

export const CreatesTag = meta.story({
  name: "タグを作成",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await waitFor(async () => {
      await expect(
        canvas.getByRole("link", { name: /frontend/ })
      ).toBeInTheDocument();
    });
    await userEvent.click(canvas.getByRole("button", { name: "新規タグ" }));
    await waitFor(async () => {
      await expect(
        body.getByRole("heading", { name: "新規タグ" })
      ).toBeInTheDocument();
    });
    await userEvent.type(body.getByLabelText("タグ名"), "observability");
    await userEvent.click(body.getByRole("button", { name: "作成" }));
    // 実 codec 経路で tags.create が呼ばれ、成功でダイアログが閉じる
    await waitFor(async () => {
      await expect(
        body.queryByRole("heading", { name: "新規タグ" })
      ).not.toBeInTheDocument();
    });
  },
});

export const CreateFailure = meta.story({
  name: "作成失敗",
  beforeEach: async () => {
    createFixture = () => {
      throw new Error("server boom");
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await waitFor(async () => {
      await expect(
        canvas.getByRole("link", { name: /frontend/ })
      ).toBeInTheDocument();
    });
    await userEvent.click(canvas.getByRole("button", { name: "新規タグ" }));
    await userEvent.type(body.getByLabelText("タグ名"), "frontend");
    await userEvent.click(body.getByRole("button", { name: "作成" }));
    await waitFor(async () => {
      await expect(body.getByRole("alert")).toHaveTextContent(
        "タグの作成に失敗しました"
      );
    });
    await expect(body.getByLabelText("タグ名")).toHaveValue("frontend");
  },
});

export const RenamesTag = meta.story({
  name: "タグ名を変更",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await waitFor(async () => {
      await expect(
        canvas.getByRole("link", { name: /frontend/ })
      ).toBeInTheDocument();
    });
    await userEvent.click(
      canvas.getByRole("button", { name: "「frontend」を改名" })
    );
    await waitFor(async () => {
      await expect(
        body.getByRole("heading", { name: "タグ名を変更" })
      ).toBeInTheDocument();
    });
    await expect(body.getByLabelText("タグ名")).toHaveValue("frontend");
    await userEvent.clear(body.getByLabelText("タグ名"));
    await userEvent.type(body.getByLabelText("タグ名"), "frontend-2026");
    await userEvent.click(body.getByRole("button", { name: "保存" }));
    await waitFor(async () => {
      await expect(
        body.queryByRole("heading", { name: "タグ名を変更" })
      ).not.toBeInTheDocument();
    });
  },
});

export const DeletesTag = meta.story({
  name: "タグを削除",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await waitFor(async () => {
      await expect(
        canvas.getByRole("link", { name: /frontend/ })
      ).toBeInTheDocument();
    });
    await userEvent.click(
      canvas.getByRole("button", { name: "「frontend」を削除" })
    );
    await waitFor(async () => {
      await expect(
        body.getByRole("heading", { name: "「frontend」を削除しますか？" })
      ).toBeInTheDocument();
    });
    await expect(
      body.getByText(/34 件のブックマークからも外れます/)
    ).toBeInTheDocument();
    await userEvent.click(body.getByRole("button", { name: "削除" }));
    await waitFor(async () => {
      await expect(
        body.queryByRole("heading", {
          name: "「frontend」を削除しますか？",
        })
      ).not.toBeInTheDocument();
    });
  },
});

export const Mobile = meta.story({
  name: "モバイル",
  globals: {
    viewport: {
      value: "iphone12",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByRole("link", { name: /frontend/ })
      ).toBeInTheDocument();
    });
    await expect(
      canvas.getByRole("heading", { name: "タグ" })
    ).toBeInTheDocument();
    // mobile は `+` アイコンと行末 chevron。改名・削除は出さない
    await expect(
      canvas.queryByRole("button", { name: "「frontend」を改名" })
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: "新規タグ" })
    ).toBeInTheDocument();
  },
});
