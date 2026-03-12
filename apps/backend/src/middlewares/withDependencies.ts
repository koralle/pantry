import type { MiddlewareHandler } from "hono";
import type { AppDependencies, AppDependencyFactory, AppEnv } from "../dependencies";

export const withDependencies = (
  dependencies: AppDependencies | AppDependencyFactory,
): MiddlewareHandler<AppEnv> => {
  return async (c, next) => {
    const resolvedDependencies =
      typeof dependencies === "function" ? dependencies(c) : dependencies;
    c.set("actor", resolvedDependencies.actor);
    c.set("bookmarksService", resolvedDependencies.bookmarksService);
    c.set("tagsService", resolvedDependencies.tagsService);
    await next();
  };
};
