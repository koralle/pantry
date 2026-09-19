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

const createdId = "019fae92-3bb0-78cd-b488-65ce0e26a939";

const shelfTags = [
  { id: 1, lastUsedAt: null, name: "frontend", pinned: true, sortOrder: 0 },
  { id: 2, lastUsedAt: null, name: "tanstack", pinned: false, sortOrder: 1 },
];

type CreateFixture = () => { id: string } | Promise<{ id: string }>;

let createFixture: CreateFixture;

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
  ["bookmarks.create", () => createFixture()],
  ["bookmarks.title", () => "取得したタイトル"],
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
        route: Route,
        routeOverrides: {
          "/_protected": {},
        },
      },
    },
  },
  title: "Pages / ブックマーク登録画面",
  beforeEach: async () => {
    createFixture = () => ({ id: createdId });
    await storyQueryClient.clear();
  },
});

export const Default = meta.story({
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByRole("heading", { name: "ブックマークを登録" })
      ).toBeInTheDocument();
    });
    await expect(canvas.getByLabelText("URL")).toHaveValue("");
    await expect(
      canvas.getByRole("button", { name: "登録する" })
    ).toBeEnabled();
    await expect(
      canvas.getByRole("link", { name: "キャンセル" })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: /一覧へ戻る/ })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("searchbox", { name: "タグを検索・追加" })
    ).toBeInTheDocument();
  },
});

export const InvalidUrl = meta.story({
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("URL"), "tanstack");
    await userEvent.type(canvas.getByLabelText("タイトル"), "TanStack");
    await userEvent.click(canvas.getByRole("button", { name: "登録する" }));
    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "入力内容を確認してください"
    );
    await expect(
      canvas.getByText("URLの形式が正しくありません（例: https://example.com）")
    ).toBeInTheDocument();
    // 入力値は保持される
    await expect(canvas.getByLabelText("URL")).toHaveValue("tanstack");
  },
});

export const SavePending = meta.story({
  beforeEach: async () => {
    createFixture = async () => await new Promise<never>(() => {});
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByLabelText("URL"),
      "https://example.com/article"
    );
    await userEvent.type(canvas.getByLabelText("タイトル"), "Example");
    await userEvent.click(canvas.getByRole("button", { name: "登録する" }));
    await expect(
      canvas.getByRole("button", { name: "保存中…" })
    ).toBeDisabled();
    await expect(canvas.getByLabelText("URL")).toBeDisabled();
    // 入力値は保持される
    await expect(canvas.getByLabelText("URL")).toHaveValue(
      "https://example.com/article"
    );
  },
});

export const SaveFailure = meta.story({
  beforeEach: async () => {
    createFixture = () => {
      throw new Error("server boom");
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByLabelText("URL"),
      "https://example.com/article"
    );
    await userEvent.type(canvas.getByLabelText("タイトル"), "Example");
    await userEvent.click(canvas.getByRole("button", { name: "登録する" }));
    await waitFor(async () => {
      await expect(canvas.getByRole("alert")).toHaveTextContent(
        "ブックマークの保存に失敗しました"
      );
    });
    // 入力値は保持される
    await expect(canvas.getByLabelText("URL")).toHaveValue(
      "https://example.com/article"
    );
  },
});

export const DuplicateUrl = meta.story({
  beforeEach: async () => {
    createFixture = () => {
      throw new StoryRpcError("duplicate-url", 409, "duplicate url");
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByLabelText("URL"),
      "https://example.com/article"
    );
    await userEvent.type(canvas.getByLabelText("タイトル"), "Example");
    await userEvent.click(canvas.getByRole("button", { name: "登録する" }));
    await waitFor(async () => {
      await expect(canvas.getByRole("alert")).toHaveTextContent(
        "同じURLのブックマークが既にあります"
      );
    });
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
        canvas.getByRole("heading", { name: "ブックマークを登録" })
      ).toBeInTheDocument();
    });
    const bar = within(canvas.getByRole("banner"));
    await expect(bar.getByText("登録")).toBeInTheDocument();
    // モバイルでは戻るラベルが「キャンセル」に切り替わる
    await expect(
      bar.getByRole("link", { name: "キャンセル" })
    ).toBeInTheDocument();
    await expect(
      bar.getByRole("link", { name: "アカウント" })
    ).toBeInTheDocument();
  },
});
