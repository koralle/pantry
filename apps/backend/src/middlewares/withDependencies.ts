import type { MiddlewareHandler } from "hono";
import type { AppDependencies, AppEnv } from "../dependencies";

export const withDependencies = (dependencies: AppDependencies): MiddlewareHandler<AppEnv> => {
  return async (c, next) => {
    c.set("bookmarksService", dependencies.bookmarksService);
    c.set("tagsService", dependencies.tagsService);
    await next();
  };
};
