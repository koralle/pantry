# Storybook の backend モックを MSW と fake port で行う

Route Story は oRPC の wire format（URL の組み立て、リクエスト本文の包み方、defined error の形）を手書きで再現していた。サーバー側の形式が変わると 6 本が同時に壊れる。oRPC は Storybook ではネットワーク層でモックすることを勧めているが、その道具（`@orpc/experimental-msw`）は oRPC v2 beta 専用である。そこで MSW で `/api/rpc/*` を受け、本物の `RPCHandler` に通し、差し替えるのは persistence の port（`createAppRouter(deps)` の deps）だけとした。Story のモックは `parameters.backend` に宣言し、preview の `loader` で登録する。`msw-storybook-addon` は使わない。

**Status:** accepted

## Considered Options

- **公式の `@orpc/experimental-msw` を使う** — `@orpc/*` を 2.0.0-beta へ全面移行する必要がある。wire format とエラーの形が変わり、Storybook のモックのために production の依存を beta に上げる代償が大きい。却下。
- **公式と同じく procedure の handler を差し替える** — 実測で 76 行と型 assert 3 箇所。`implement(procedure)` は middleware も落とすため認可経路が走らない。port 差し替えは 27 行、assert 0 で、認可も本番のまま走る。却下。
- **型付きヘルパーが `{ json: ... }` を組み立てる** — 通信形式の知識が storybook 側に残り、本番とのずれに気付けない。却下。
- **`msw-storybook-addon` に乗る** — handler の登録が `beforeEach` になり、framework の navigation より後に走るため loader の fetch に間に合わない。msw 2 への固定も生じる。却下。
- **ネットワーク層を使わず `createRouterClient` を `sb.mock` で注入する** — link の codec と interceptor を通らない。HTTP 境界の検証にならない。却下。

## Consequences

- Story が書くのは port の戻り値だけになる。包み方、入力検証、defined error、認可は本番と同じ経路を通る。
- 指定のない port は例外を投げ、procedure が 500 を返す。モックの書き忘れは画面のエラー状態として見える。
- モックの登録は preview の `loader` で行う。Storybook は `loaders` → `beforeEach` の順に走らせ、framework の navigation（`router.load()`）は `beforeEach` にある。この順序のおかげで、loader が発行する fetch にもその Story のモックが間に合う。逆に Story の `beforeEach` で登録すると navigation に間に合わない。
- MSW の worker ファイル（`mockServiceWorker.js`）を `src/storybook/public/` に置く。msw 本体を上げたら同じバージョンで再生成する。
- Component Story は注入された port のままとする。HTTP を使わない Story に MSW は要らない。HTTP でない境界（`authClient`、WebAuthn 対応判定）は `sb.mock` のまま。
- `@orpc/experimental-msw` が stable になったら、この自作層（`src/storybook/backend/`）を消して公式へ移す。Story 側は `parameters.backend` を書き換えるだけで済む。
- `docs/testing.md` の「Router は mock に差し替え、本番実装を直接呼ばない」は「port を fake に差し替える」へ更新する。

## コードの形

```ts
// src/storybook/backend/handlers.ts
import { RPCHandler } from "@orpc/server/fetch";
import { http } from "msw/http";

import { createAppRouter } from "../../rpc/create-app-router";

export type StoryBackend = Parameters<typeof createAppRouter>[0];

/**
 * 本番の procedure をそのまま使い、port だけを Story のものへ差し替える。
 * 包み方、入力検証、defined error、認可は本番の経路が作る。
 */
export function createRpcHandler(backend: StoryBackend) {
  const handler = new RPCHandler(createAppRouter(backend));

  return http.post("/api/rpc/*", async ({ request }) => {
    const { matched, response } = await handler.handle(request, {
      context: { headers: request.headers },
      prefix: "/api/rpc",
    });

    return matched ? response : new Response(null, { status: 404 });
  });
}
```

```ts
// src/storybook/backend/defaults.ts
import * as v from "valibot";

import { userIdSchema } from "../../features/auth/domain/auth-values";
import type { StoryBackend } from "./handlers";

const session = {
  email: "koralle@example.com",
  id: v.parse(userIdSchema, "story-user"),
  name: "koralle",
};

/** 画面がシェルとして必ず読むものだけを既定にする。 */
const shell: Partial<StoryBackend> = {
  getBookmarkCount: async () => 0,
  getSession: async () => session,
  listBookmarks: async () => ({ items: [], nextCursor: null }),
  listShelfTags: async () => [],
};

/** 指定のない port は例外を投げる。書き忘れは 500 として画面に出る。 */
export const resolveBackend = (
  overrides: Partial<StoryBackend> = {}
): StoryBackend =>
  new Proxy(
    { ...shell, ...overrides },
    {
      get: (target, key) =>
        Reflect.get(target, key) ??
        (() => {
          throw new Error(
            `Storybook: port ${String(key)} はモックされていない`
          );
        }),
    }
  ) as StoryBackend;
```

```tsx
// src/storybook/preview.tsx（抜粋）
import { setupWorker } from "msw/browser";

import { resolveBackend } from "./backend/defaults";
import { createRpcHandler } from "./backend/handlers";

const worker = setupWorker();

export default definePreview({
  async beforeAll() {
    await worker.start({
      onUnhandledFrame: bypassStorybookInternals,
      quiet: true,
    });
  },
  // loaders は beforeEach より先に走る。framework の navigation は beforeEach に
  // あるので、loader が発行する fetch にもこの時点で差し替えが間に合う。
  loaders: [
    (context) => {
      worker.resetHandlers(
        createRpcHandler(resolveBackend(context.parameters.backend))
      );
    },
  ],
});
```

```tsx
// src/routes/_protected/bookmarks/$id/stories/edit.tsx（抜粋）
export const UpdateHasDuplicateUrl = meta.story({
  parameters: {
    backend: {
      // 本番の procedure がこの結果を defined error へ写す。
      updateBookmark: async () => ({ kind: "duplicate-url" }),
    },
  },
  play: async ({ canvasElement }) => {
    // 変更を保存 → 「同じ URL のブックマークが既にあります」
  },
});

export const BookmarkIsNotFound = meta.story({
  parameters: { backend: { findBookmarkEditor: async () => null } },
  // → procedure が bookmark-not-found を投げ、画面は「見つかりません」を出す
});
```
