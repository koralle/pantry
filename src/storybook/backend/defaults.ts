import * as v from "valibot";

import { userIdSchema } from "../../features/auth/domain/auth-values";
import type { AppRouterDeps } from "../../rpc/create-app-router";

const session = {
  email: "koralle@example.com",
  id: v.parse(userIdSchema, "user-1"),
  name: "koralle",
};

/** シェル（`_protected` の beforeLoad / loader）が読むものだけを既定にする。 */
const shell: Partial<AppRouterDeps> = {
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
  overrides: Partial<AppRouterDeps> = {}
): AppRouterDeps => {
  const backend: Partial<AppRouterDeps> = new Proxy(
    { ...shell, ...overrides },
    {
      get: (target, key) => {
        const port = target[key as keyof AppRouterDeps];

        return (
          port ??
          (() => {
            const message = `Storybook: port ${String(key)} はモックされていない`;
            console.error(message);
            throw new Error(message);
          })
        );
      },
    }
  );

  // SAFETY: Proxy の型は Partial にしかならない。未宣言 port は実行時例外にする
  // 契約なので、Story が読む port はすべて提供されるとみなせる。
  return backend as AppRouterDeps;
};
