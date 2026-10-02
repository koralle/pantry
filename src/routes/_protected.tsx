import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { isInternalPath } from "../features/auth/lib/is-internal-path";
import { getRpcClient } from "../rpc/runtime-client";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ location }) => {
    // 一覧の正規化は認証状態より優先する。`/` は未認証でも `/bookmarks` へ恒久リダイレクトし、
    // ログイン後の戻り先が `/` を再経由しないようにする。
    // search は raw のまま引き継ぎ、未知・不正パラメータの扱いは一覧ルートの validateSearch に委譲する。
    if (location.pathname === "/") {
      throw redirect({
        href: `/bookmarks${location.searchStr}`,
        statusCode: 301,
      });
    }

    const client = await getRpcClient();
    const session = await client.auth.session();

    if (session === null) {
      throw redirect({
        to: "/sign-in",
        search: {
          redirect: isInternalPath(location.href)
            ? location.href
            : "/bookmarks",
        },
      });
    }

    return session;
  },
  loader: async ({ context }) => {
    const client = await getRpcClient();
    const orpc = createTanstackQueryUtils(client);
    // レールのデータは先に温めるだけ。待ち合わせは useSuspenseQuery 側の
    // Suspense 境界に任せ、ページ本体をブロックしない。
    const shelfTagsPromise = context.queryClient.ensureQueryData(
      orpc.tags.shelf.queryOptions({ staleTime: 5000 })
    );
    const countsPromise = context.queryClient.ensureQueryData(
      orpc.bookmarks.counts.queryOptions({ staleTime: 5000 })
    );

    return { countsPromise, shelfTagsPromise };
  },
  // 画面ごとのシェル（StandardShell / WorkbenchShell）はルート側で選ぶ。
  component: () => <Outlet />,
});
