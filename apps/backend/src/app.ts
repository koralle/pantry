import { resolveActor } from "./auth/actor";
import { createApp } from "./createApp";
import type { AppDependencyFactory } from "./dependencies";
import { createBookmarksService } from "./services/bookmarks";
import { createTagsService } from "./services/tags";

const productionDependencies: AppDependencyFactory = (c) => {
  const actor = resolveActor(c);

  return {
    actor,
    bookmarksService: createBookmarksService({
      db: c.env.DB,
      actor,
    }),
    tagsService: createTagsService({
      db: c.env.DB,
      actor,
    }),
  };
};

const app = createApp(productionDependencies);

export default app;
