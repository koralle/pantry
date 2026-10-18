import { createRouterKit } from "./base";
import type { RouterDeps } from "./base";
import { createBookmarksRouter } from "./bookmarks";
import { createTagsRouter } from "./tags";

export type { RouterDeps } from "./base";

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
