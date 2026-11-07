# Storybook の backend モックを MSW と fake port で行う

Route Story は oRPC の wire format（URL の組み立て、リクエスト本文の包み方、defined error の形）を手書きで再現していた。サーバー側の形式が変わると 6 本が同時に壊れる。oRPC は Storybook ではネットワーク層でモックすることを勧めているが、その道具（`@orpc/experimental-msw`）は oRPC v2 beta 専用である。そこで MSW で `/api/rpc/*` を受け、本物の `RPCHandler` に通し、差し替えるのは persistence の port（`createAppRouter(deps)` の deps）だけとした。Story のモックは `parameters.backend` に宣言し、preview の `loader` で登録する。差し替えはアプリの fetch の取得方法に依存しないネットワーク層（Service Worker）で行い、`msw-storybook-addon` は使わない。worker スクリプトは `msw/vite` の `worker-only` モードで配信し、生成物は commit しない。

**Status:** accepted

## Considered Options

- **公式の `@orpc/experimental-msw` を使う** — `@orpc/*` を 2.0.0-beta へ全面移行する必要がある。wire format とエラーの形が変わり、Storybook のモックのために production の依存を beta に上げる代償が大きい。却下。
- **公式と同じく procedure の handler を差し替える** — 実測で 76 行と型 assert 3 箇所。`implement(procedure)` は middleware も落とすため認可経路が走らない。port 差し替えは 27 行、assert 0 で、認可も本番のまま走る。却下。
- **型付きヘルパーが `{ json: ... }` を組み立てる** — 通信形式の知識が storybook 側に残り、本番とのずれに気付けない。却下。
- **`globalThis.fetch` を preview で 1 回だけ差し替え、`/api/rpc/*` を本物の `RPCHandler` に流す** — 20 行ほどで同じ保証（本番の wire format・入力検証・defined error・認可）が得られる最小案。ただしモックが効くかどうかがアプリの fetch の取得方法に依存する。`rpc/client.ts` は「呼び出し毎に `globalThis.fetch` を解決する」ため今は成立するが、それはアプリ側の実装詳細であり、link 構築時に fetch を束ねる、別の通信手段を使う、といった変更でモックが外れる。外れたことは「画面のエラー」として現れるため、原因が mock の不発か通信の失敗か切り分けにくい。テスト基盤を本番コードの実装詳細へ結合させないため却下。
- **`msw-storybook-addon` に乗る** — CSF Next では `parameters.msw` が無く、Story ごとの handler は story の `beforeEach({ msw })` に書くしかない（addon 自身は worker の起動と reset を project の `beforeEach` で行う）。story の `beforeEach` は project の `beforeEach`（framework の navigation を含む）より後に走るので loader の fetch に間に合わない。addon 3.0.3 の既定 setup は msw 2 の `onUnhandledRequest` を渡しており msw 3 では効かない。却下。
- **`msw init` の生成物を commit し `staticDirs` で配信する** — msw を上げるたびに worker を同じバージョンで作り直す規律が要り、本体と生成物のずれが残る。`msw/vite`（`mode: "worker-only"`）が dev の配信と build の emit を担うため、生成物を持たない。却下。
- **ネットワーク層を使わず `createRouterClient` を `sb.mock` で注入する** — link の codec と interceptor を通らない。HTTP 境界の検証にならない。却下。

## Consequences

- Story が書くのは port の戻り値だけになる。包み方、入力検証、defined error、認可は本番と同じ経路を通る。
- 指定のない port は例外を投げ、procedure が 500 を返す。モックの書き忘れは画面のエラー状態として見える。port 名は `defaults.ts` の fallback が `console.error` で出す。oRPC は非 defined エラーの message を `Internal server error` に置き換えるため、ログが無いとどの port が未宣言か分からない。
- モックの登録は preview の `loader` で行う。Storybook は `loaders` → `beforeEach` の順に走らせ、framework の navigation（`router.load()`）は `beforeEach` にある。この順序のおかげで、loader が発行する fetch にもその Story のモックが間に合う。逆に Story の `beforeEach` で登録すると navigation に間に合わない。順序は storybook 10.6.2 の実装（`applyLoaders` → `applyBeforeEach`）と、`@storybook/tanstack-react` の framework `beforeEach` が `router.load()` を呼ぶことで確認した。
- 既定の port はシェル（`_protected` の `beforeLoad` / `loader`）が読むものだけにする。一覧のように画面が読むものは Story が宣言し、宣言し忘れが「空」として通らないようにする。
- worker スクリプトは `msw/vite` の `mode: "worker-only"` で配信する。dev は Vite の middleware が返し、`build-storybook` は asset として emit する。生成物を commit しないので、msw 本体とのバージョンずれも起きない。emit 先が想定と違う場合は `msw init` の生成物 + `staticDirs` へフォールバックする（msw 2 系に `msw/vite` は無いため、2.15.0 へ落とす場合はこの形になる）。
- msw 3 系と Storybook の iframe / Service Worker の組み合わせは未検証。動かなければ `msw init` の生成物 + `staticDirs`、それでも駄目なら「`globalThis.fetch` を差し替えて本物の `RPCHandler` に流す」案へ戻す。
- Component Story は注入された port のままとする。HTTP を使わない Story に MSW は要らない。HTTP でない境界（`authClient`、WebAuthn 対応判定）は `sb.mock` のまま。
- `@orpc/experimental-msw` が stable になったら、この自作層（`src/storybook/backend/`）を消して公式へ寄せられる。ただし公式は procedure を差し替える（`implement(contract)`）ため、そのまま移ると本番の procedure と認可を通る性質は失われる。移行は「自作層を消す」だけで済むが、無条件のゴールではなく、どの保証を捨てるかの判断を伴う。
- `docs/testing.md` の「Router は mock に差し替え、本番実装を直接呼ばない」は「port を fake に差し替える」へ更新する。
- Storybook は CI で実行されない（`pnpm test` / `pnpm run build` の対象外）。この層の破損はローカル起動で気づくまで残る。Storybook の検証は #305 の対象。

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

/** シェル（`_protected` の beforeLoad / loader）が読むものだけを既定にする。 */
const shell: Partial<StoryBackend> = {
  getBookmarkCount: async () => 0,
  getSession: async () => session,
  listShelfTags: async () => [],
};

/**
 * 指定のない port は例外を投げる。書き忘れは 500 として画面に出る。
 * oRPC は非 defined エラーの message を "Internal server error" に置き換えるので、
 * どの port が未宣言かはここでログに残す。
 */
export const resolveBackend = (
  overrides: Partial<StoryBackend> = {}
): StoryBackend =>
  new Proxy(
    { ...shell, ...overrides },
    {
      get: (target, key) =>
        Reflect.get(target, key) ??
        (() => {
          const message = `Storybook: port ${String(key)} はモックされていない`;
          console.error(message);
          throw new Error(message);
        }),
    }
  ) as StoryBackend;
```

```ts
// src/storybook/vite.config.ts（抜粋）
import { msw } from "msw/vite";
import { defineConfig } from "vite";

export default defineConfig({
  // worker-only: /mockServiceWorker.js を dev では middleware が返し、
  // build-storybook では asset として emit する。virtual モジュールは使わない。
  plugins: [msw({ mode: "worker-only" })],
});
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
      // Storybook 内部のリクエストだけを bypass する。/api/rpc/* を含めると、
      // 未知の procedure が dev server の 404 になり、mock の不発と区別できない。
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
