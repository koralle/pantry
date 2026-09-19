import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect, userEvent, waitFor, within } from "storybook/test";

import preview from "../../../../storybook/preview";
import { Route } from "./edit";

const storyQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const bookmarkId = "019fae92-3bb0-78cd-b488-65ce0e26a939";

const editorRecord = {
  id: bookmarkId,
  note: "要点だけ残す",
  tagIds: [1],
  title: "TanStack Router の型安全な検索パラメータ",
  url: "https://tanstack.com/router/latest/docs/guide/search-params",
};

const shelfTags = [
  { id: 1, lastUsedAt: null, name: "frontend", pinned: true, sortOrder: 0 },
  { id: 2, lastUsedAt: null, name: "tanstack", pinned: false, sortOrder: 1 },
];

type EditorFixture = () => typeof editorRecord | Promise<typeof editorRecord>;
type UpdateFixture = () => { id: string } | Promise<{ id: string }>;

let editorFixture: EditorFixture;
let updateFixture: UpdateFixture;

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
  ["bookmarks.editor", () => editorFixture()],
  ["bookmarks.update", () => updateFixture()],
  ["bookmarks.title", () => "取得したタイトル"],
  ["bookmarks.delete", () => ({ id: bookmarkId })],
  ["bookmarks.counts", () => ({ favorites: 0, inbox: 0, recent: 0 })],
  ["tags.shelf", () => shelfTags],
  [
    "tags.create",
    (input) => ({ id: 99, name: (input as { name: string }).name }),
  ],
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
          "/_protected/bookmarks/$id/edit": {
            loader: async () => ({ kind: "ok" as const }),
          },
        },
      },
    },
  },
  title: "Pages / ブックマーク編集画面",
  beforeEach: async () => {
    editorFixture = () => editorRecord;
    updateFixture = () => ({ id: bookmarkId });
    await storyQueryClient.clear();
  },
});

export const Default = meta.story({
  name: "既定",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByRole("heading", { name: "ブックマークを編集" })
      ).toBeInTheDocument();
    });
    await expect(canvas.getByLabelText("URL")).toHaveValue(editorRecord.url);
    await expect(canvas.getByLabelText("タイトル")).toHaveValue(
      editorRecord.title
    );
    await expect(
      canvas.getByRole("button", { name: "frontendを外す" })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: "変更を保存" })
    ).toBeEnabled();
    await expect(
      canvas.getByRole("link", { name: "キャンセル" })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: /削除/ })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: /詳細へ戻る/ })
    ).toBeInTheDocument();
  },
});

export const InitialLoading = meta.story({
  name: "初回読み込み中",
  beforeEach: async () => {
    editorFixture = async () => await new Promise<never>(() => {});
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByText("ブックマークを読み込み中")
      ).toBeInTheDocument();
    });
    await expect(
      canvas.queryByRole("heading", { name: "ブックマークを編集" })
    ).not.toBeInTheDocument();
  },
});

export const BookmarkIsNotFound = meta.story({
  name: "ブックマークが見つからない",
  beforeEach: async () => {
    editorFixture = async () => {
      throw new StoryRpcError("bookmark-not-found", 404, "bookmark not found");
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByText("このブックマークは見つかりません")
      ).toBeInTheDocument();
    });
    await expect(
      canvas.getByRole("link", { name: "一覧へ戻る" })
    ).toBeInTheDocument();
  },
});

export const UpdateHasDuplicateUrl = meta.story({
  name: "URL重複で更新失敗",
  beforeEach: async () => {
    updateFixture = () => {
      throw new StoryRpcError("duplicate-url", 409, "duplicate url");
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByRole("button", { name: "変更を保存" })
      ).toBeEnabled();
    });
    await userEvent.click(canvas.getByRole("button", { name: "変更を保存" }));
    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "同じ URL のブックマークが既にあります"
    );
  },
});

export const UpdateHasUnexpectedError = meta.story({
  name: "更新で予期しないエラー",
  beforeEach: async () => {
    updateFixture = () => {
      throw new Error("server boom");
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByRole("button", { name: "変更を保存" })
      ).toBeEnabled();
    });
    await userEvent.click(canvas.getByRole("button", { name: "変更を保存" }));
    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "保存に失敗しました"
    );
  },
});

export const UpdatePending = meta.story({
  name: "更新中",
  beforeEach: async () => {
    updateFixture = async () => await new Promise<never>(() => {});
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByRole("button", { name: "変更を保存" })
      ).toBeEnabled();
    });
    await userEvent.click(canvas.getByRole("button", { name: "変更を保存" }));
    await expect(
      canvas.getByRole("button", { name: "保存中…" })
    ).toBeDisabled();
    await expect(canvas.getByLabelText("URL")).toBeDisabled();
    // 入力値は保持される
    await expect(canvas.getByLabelText("URL")).toHaveValue(editorRecord.url);
  },
});
