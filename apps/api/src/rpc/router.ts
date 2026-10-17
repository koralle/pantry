import { createRouterKit } from "./base";
import type { RouterDeps } from "./base";
import { createBookmarksRouter } from "./bookmarks";
import { createTagsRouter } from "./tags";

export type { RouterDeps } from "./base";

/**
 * contract を実装した oRPC router を作る。
 *
 * `health` は認証なし。それ以外は requireAuth middleware を通し、未認証を contract の
 * 型付きエラー `UNAUTHORIZED`（401）へ写す。機能ごとの実装は `tags.ts` / `bookmarks.ts` に置く。
 */
export const createRouter = (deps: RouterDeps) => {
  const kit = createRouterKit(deps);
  const { impl, requireAuth } = kit;

  return impl.router({
    bookmarks: createBookmarksRouter(kit),
    health: impl.health.handler(() => ({ status: "ok" })),
    me: impl.me.use(requireAuth).handler(({ context }) => context.user),
    tags: createTagsRouter(kit),
  });
};
