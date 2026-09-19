import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
  useSearch,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useRef } from "react";
import * as v from "valibot";

import { AppShell } from "../features/app-shell/components/app-shell";
import { NavRailRoute } from "../features/app-shell/components/nav-rail-route";
import type { ShellView } from "../features/app-shell/lib/shell-nav";
import { isInternalPath } from "../features/auth/lib/is-internal-path";
import { bookmarkUrlSchema } from "../features/bookmarks/domain/bookmark-values";
import type { BookmarkSearchSchema } from "../features/navigation/lib/bookmark-search";
import { defaultBookmarkSearch } from "../features/navigation/lib/bookmark-search";
import {
  buildListSearch,
  detailSearchFromList,
  resolveChromeListSearch,
} from "../features/navigation/lib/bookmark-search-builders";
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
  component: () => <Layout />,
});

const SHELL_LESS_PATH = /^\/bookmarks\/(?:new|quick|[^/]+\/edit)\/?$/;

const viewForPath = (
  pathname: string,
  listSearch: BookmarkSearchSchema | undefined
): ShellView => {
  if (pathname.startsWith("/tags")) {
    return "tags";
  }
  if (pathname.startsWith("/settings")) {
    return "account";
  }
  return listSearch?.view ?? "recent";
};

function Layout() {
  const indexSearch = useSearch({
    from: "/_protected/bookmarks/",
    shouldThrow: false,
  });
  const detailSearch = useSearch({
    from: "/_protected/bookmarks/$id/",
    shouldThrow: false,
  });
  const newSearch = useSearch({
    from: "/_protected/bookmarks/new/",
    shouldThrow: false,
  });
  const quickSearch = useSearch({
    from: "/_protected/bookmarks/quick/",
    shouldThrow: false,
  });
  const editSearch = useSearch({
    from: "/_protected/bookmarks/$id/edit",
    shouldThrow: false,
  });
  const rememberedListSearch = useRef(indexSearch);
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  if (indexSearch !== undefined) {
    rememberedListSearch.current = indexSearch;
  }

  const listSearch = resolveChromeListSearch(
    indexSearch,
    rememberedListSearch.current,
    [detailSearch, newSearch, quickSearch, editSearch]
  );

  // クイック追加・フォームは集中フロー（専用画面）としてシェルを出さない
  if (SHELL_LESS_PATH.test(pathname)) {
    return <Outlet />;
  }

  return (
    <ShellLayout listSearch={listSearch} pathname={pathname}>
      <Outlet />
    </ShellLayout>
  );
}

function ShellLayout({
  listSearch,
  pathname,
  children,
}: {
  readonly listSearch: BookmarkSearchSchema | undefined;
  readonly pathname: string;
  readonly children: ReactNode;
}) {
  const navigate = useNavigate();

  const view = viewForPath(pathname, listSearch);

  const commitSearch = (raw: string) => {
    const nextQ = raw.trim();
    const current = listSearch ?? defaultBookmarkSearch;
    // コマンドバーへの URL 貼付はクイック追加画面を開く
    if (v.safeParse(bookmarkUrlSchema, nextQ).success) {
      void navigate({
        search: { ...detailSearchFromList(current), url: nextQ },
        to: "/bookmarks/quick",
      });
      return;
    }
    void navigate({
      search:
        nextQ === ""
          ? buildListSearch(current, { clearQ: true })
          : buildListSearch(current, { q: nextQ }),
      to: "/bookmarks",
    });
  };

  return (
    <AppShell
      newSearch={
        listSearch === undefined ? {} : detailSearchFromList(listSearch)
      }
      onSearchSubmit={commitSearch}
      rail={
        <NavRailRoute
          filterTags={listSearch?.tags}
          layout={listSearch?.layout}
          view={view}
        />
      }
      searchDefaultValue={listSearch?.q ?? ""}
      view={view}
    >
      {children}
    </AppShell>
  );
}
