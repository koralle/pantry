import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect, userEvent, waitFor, within } from "storybook/test";

import preview from "../../../../storybook/preview";
import { Route } from "./index";

const storyQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const bookmarkId = "019fae92-3bb0-78cd-b488-65ce0e26a939";

const detailRecord = {
  createdAt: "2026-09-14T00:00:00.000Z",
  favorite: false,
  id: bookmarkId,
  note: "search params の型付けと validateSearch の使い方。loader での検証パターンが参考になる。",
  tagNames: ["frontend", "tanstack"],
  title: "TanStack Router の型安全な検索パラメータ",
  updatedAt: "2026-09-16T00:00:00.000Z",
  url: "https://tanstack.com/router/latest/docs/guide/search-params",
};

type DetailFixture = () => typeof detailRecord | Promise<typeof detailRecord>;
type FavoriteFixture = (input: { favorite: boolean }) => { id: string };

let detailFixture: DetailFixture;
let favoriteFixture: FavoriteFixture;

/**
 * fixture が投げると oRPC の defined error envelope として返す。
 * 画面側は ORPCError defined として受け取る。
 */
class StoryRpcError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status: number, message: string) {
    super(message);
    this.name = "StoryRpcError";
    this.code = code;
    this.status = status;
  }
}

type StoryRpcHandler = (input: unknown) => unknown;

// rpc/client.ts は fetch を呼び出し毎に解決するので、ここで差し替えた
// global fetch がそのまま拾われる。oRPC の wire format（{json} envelope）に
// 合わせて fixture を返し、実際の link codec 経路ごと検証する。
const storyRpcHandlers = new Map<string, StoryRpcHandler>([
  ["bookmarks.detail", () => detailFixture()],
  [
    "bookmarks.setFavorite",
    (input) => favoriteFixture(input as { favorite: boolean }),
  ],
  ["bookmarks.delete", () => ({ id: bookmarkId })],
  ["bookmarks.counts", () => ({ favorites: 0, inbox: 0, recent: 0 })],
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
    if (error instanceof StoryRpcError) {
      return Response.json(
        {
          json: {
            code: error.code,
            defined: true,
            message: error.message,
            status: error.status,
          },
        },
        { status: error.status }
      );
    }
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

const meta = preview.meta({
  decorators: [
    (Story) => (
      <QueryClientProvider client={storyQueryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    tanstack: {
      router: {
        params: {
          id: bookmarkId,
        },
        route: Route,
        routeOverrides: {
          "/_protected": {},
          "/_protected/bookmarks/$id/": {
            loader: async () => ({}),
          },
        },
      },
    },
  },
  title: "Pages / ブックマーク詳細画面",
  beforeEach: async () => {
    detailFixture = () => detailRecord;
    favoriteFixture = () => ({ id: bookmarkId });
    await storyQueryClient.clear();
  },
});

export const Default = meta.story({
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByRole("heading", { name: detailRecord.title })
      ).toBeInTheDocument();
    });
    await expect(
      canvas.getByRole("button", { name: "お気に入りに追加" })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: /サイトを開く/ })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: /編集/ })
    ).toBeInTheDocument();
  },
});

export const Favorite = meta.story({
  beforeEach: async () => {
    detailFixture = () => ({ ...detailRecord, favorite: true });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByRole("button", { name: "お気に入りを解除" })
      ).toBeInTheDocument();
    });
    await expect(
      canvas.getByRole("button", { name: "お気に入りを解除" })
    ).toHaveAttribute("aria-pressed", "true");
  },
});

export const FavoriteToggle = meta.story({
  beforeEach: async () => {
    let favorited = false;
    detailFixture = () => ({ ...detailRecord, favorite: favorited });
    favoriteFixture = (input) => {
      favorited = input.favorite;
      return { id: bookmarkId };
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByRole("button", { name: "お気に入りに追加" })
      ).toBeEnabled();
    });
    await userEvent.click(
      canvas.getByRole("button", { name: "お気に入りに追加" })
    );
    await waitFor(async () => {
      await expect(
        canvas.getByRole("button", { name: "お気に入りを解除" })
      ).toHaveAttribute("aria-pressed", "true");
    });
  },
});

export const InitialLoading = meta.story({
  beforeEach: async () => {
    detailFixture = async () => await new Promise<never>(() => {});
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("読み込み中…")).toBeInTheDocument();
    await expect(
      canvas.queryByRole("heading", { name: detailRecord.title })
    ).not.toBeInTheDocument();
  },
});

export const BookmarkIsNotFound = meta.story({
  beforeEach: async () => {
    detailFixture = async () => {
      throw new StoryRpcError("bookmark-not-found", 404, "bookmark not found");
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByText("ブックマークが見つかりません")
      ).toBeInTheDocument();
    });
    await expect(
      canvas.getByRole("link", { name: "一覧へ戻る" })
    ).toBeInTheDocument();
  },
});

export const LoadError = meta.story({
  beforeEach: async () => {
    detailFixture = async () => {
      throw new Error("server boom");
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByText("詳細の読み込みに失敗しました")
      ).toBeInTheDocument();
    });
    await expect(
      canvas.getByRole("button", { name: /再試行/ })
    ).toBeInTheDocument();
  },
});
