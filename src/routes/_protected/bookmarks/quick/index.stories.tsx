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
  { id: 1, lastUsedAt: null, name: "React", pinned: true, sortOrder: 0 },
  { id: 2, lastUsedAt: null, name: "TypeScript", pinned: false, sortOrder: 1 },
  { id: 3, lastUsedAt: null, name: "Cloudflare", pinned: false, sortOrder: 2 },
];

type TitleFixture = () => string | null | Promise<string | null>;
type CreateFixture = () => { id: string } | Promise<{ id: string }>;

let titleFixture: TitleFixture;
let createFixture: CreateFixture;

type StoryRpcHandler = (input: unknown) => unknown;

// rpc/client.ts は fetch を呼び出し毎に解決するので、ここで差し替えた
// global fetch がそのまま拾われる。oRPC の wire format（{json} envelope）に
// 合わせて fixture を返し、実際の link codec 経路ごと検証する。
const storyRpcHandlers = new Map<string, StoryRpcHandler>([
  ["bookmarks.create", () => createFixture()],
  ["bookmarks.counts", () => ({ favorites: 0, inbox: 0, recent: 0 })],
  ["bookmarks.list", () => ({ items: [], nextCursor: null })],
  ["bookmarks.title", () => titleFixture()],
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
  title: "Pages / クイック追加",
  beforeEach: async () => {
    titleFixture = () => "TanStack Router の型安全な検索パラメータ";
    createFixture = () => ({ id: createdId });
    await storyQueryClient.clear();
  },
});

const prefilledParameters = {
  tanstack: {
    router: {
      query: {
        url: "https://tanstack.com/router/latest",
      },
    },
  },
};

export const Input = meta.story({
  name: "URL入力",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(canvas.getByLabelText("URL")).toBeInTheDocument();
    });
    await expect(
      canvas.getByRole("button", { name: "登録する" })
    ).toBeDisabled();
    // シェル無し: ナビやコマンドバーは出ない
    await expect(canvas.queryByRole("navigation")).not.toBeInTheDocument();
    await expect(canvas.queryByRole("search")).not.toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: /一覧へ戻る/ })
    ).toBeInTheDocument();
  },
});

export const ManualFlow = meta.story({
  name: "手入力フロー",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByLabelText("URL"),
      "https://tanstack.com/router/latest"
    );
    await userEvent.click(canvas.getByRole("button", { name: "登録する" }));
    // タイトル取得 → 確認カード
    await waitFor(async () => {
      await expect(
        canvas.getByText("TanStack Router の型安全な検索パラメータ")
      ).toBeInTheDocument();
    });
    await expect(canvas.getByText("tanstack.com")).toBeInTheDocument();
  },
});

export const PrefilledUrl = meta.story({
  name: "URL入力済み",
  parameters: prefilledParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // URL prefill → 自動でタイトル取得 → 確認カードへ
    await waitFor(async () => {
      await expect(
        canvas.getByText("TanStack Router の型安全な検索パラメータ")
      ).toBeInTheDocument();
    });
    await expect(canvas.getByText("tanstack.com")).toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: "登録する" })
    ).toBeEnabled();
    await expect(
      canvas.getByRole("searchbox", { name: "タグを検索・追加" })
    ).toBeInTheDocument();
    await expect(canvas.getByLabelText("メモ（任意）")).toBeInTheDocument();
  },
});

export const PrefillFetching = meta.story({
  name: "プリフィル取得中",
  beforeEach: async () => {
    titleFixture = async () => await new Promise<never>(() => {});
  },
  parameters: prefilledParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(canvas.getByText("タイトルを取得中…")).toBeInTheDocument();
    });
    await expect(
      canvas.getByText("https://tanstack.com/router/latest")
    ).toBeInTheDocument();
  },
});

export const TitleFetchFailed = meta.story({
  name: "タイトル取得失敗",
  beforeEach: async () => {
    titleFixture = () => null;
  },
  parameters: prefilledParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByText(/タイトルを取得できませんでした/)
      ).toBeInTheDocument();
    });
    await expect(canvas.getByLabelText("タイトル")).toBeInTheDocument();
  },
});

export const SavesAndCompletes = meta.story({
  name: "登録して完了",
  parameters: prefilledParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByRole("button", { name: "登録する" })
      ).toBeEnabled();
    });
    await userEvent.click(canvas.getByRole("button", { name: "登録する" }));
    await waitFor(async () => {
      await expect(
        canvas.getByRole("heading", { name: "保存しました" })
      ).toBeInTheDocument();
    });
    await expect(
      canvas.getByRole("link", { name: /詳細を見る/ })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: /タグを編集/ })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: "続けて登録" })
    ).toBeInTheDocument();
    // 完了後もシェルは出ない
    await expect(canvas.queryByRole("navigation")).not.toBeInTheDocument();
  },
});

export const ConsecutiveRegistration = meta.story({
  name: "連続登録",
  parameters: prefilledParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByRole("button", { name: "登録する" })
      ).toBeEnabled();
    });
    await userEvent.click(canvas.getByRole("button", { name: "登録する" }));
    await waitFor(async () => {
      await expect(
        canvas.getByRole("heading", { name: "保存しました" })
      ).toBeInTheDocument();
    });
    await userEvent.click(canvas.getByRole("button", { name: "続けて登録" }));
    // 入力状態へ戻り、URL は空にリセットされる
    await waitFor(async () => {
      await expect(canvas.getByLabelText("URL")).toHaveValue("");
    });
    // 2 件目もそのまま流せる
    await userEvent.type(
      canvas.getByLabelText("URL"),
      "https://example.com/second"
    );
    await userEvent.click(canvas.getByRole("button", { name: "登録する" }));
    await waitFor(async () => {
      await expect(
        canvas.getByRole("button", { name: "登録する" })
      ).toBeEnabled();
    });
    await userEvent.click(canvas.getByRole("button", { name: "登録する" }));
    await waitFor(async () => {
      await expect(
        canvas.getByRole("heading", { name: "保存しました" })
      ).toBeInTheDocument();
    });
  },
});

export const SaveFailure = meta.story({
  name: "保存失敗",
  beforeEach: async () => {
    createFixture = () => {
      throw new Error("server boom");
    };
  },
  parameters: prefilledParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByRole("button", { name: "登録する" })
      ).toBeEnabled();
    });
    await userEvent.click(canvas.getByRole("button", { name: "登録する" }));
    await waitFor(async () => {
      await expect(canvas.getByRole("alert")).toHaveTextContent(
        "ブックマークの保存に失敗しました"
      );
    });
    await expect(
      canvas.getByRole("button", { name: "もう一度保存" })
    ).toBeEnabled();
  },
});

export const Mobile = meta.story({
  name: "モバイル",
  globals: {
    viewport: {
      value: "iphone12",
    },
  },
  parameters: prefilledParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByText("TanStack Router の型安全な検索パラメータ")
      ).toBeInTheDocument();
    });
    await expect(
      canvas.getByRole("link", { name: "キャンセル" })
    ).toBeInTheDocument();
    await expect(canvas.queryByRole("navigation")).not.toBeInTheDocument();
  },
});
