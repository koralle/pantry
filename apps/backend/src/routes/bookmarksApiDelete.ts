import { createFactory } from "hono/factory";
import { type AppEnv, getAppDependency } from "../dependencies";
import type { BookmarksApiDeleteContext } from "../generated/bookmarks/bookmarks.context";
import { BookmarksApiDeleteParams } from "../generated/bookmarks/bookmarks.zod";
import { zValidator } from "../generated/validator";
import { toDeleteBookmarkServiceInput } from "./bookmarks.mapper";

const factory = createFactory();
export const bookmarksApiDeleteHandlers = factory.createHandlers(
  zValidator("param", BookmarksApiDeleteParams),
  async (c: BookmarksApiDeleteContext<AppEnv>) => {
    const bookmarksService = getAppDependency(c, "bookmarksService");
    const params = c.req.valid("param");
    const serviceInput = toDeleteBookmarkServiceInput(params);
    await bookmarksService.delete(serviceInput);

    return c.body(null, 204);
  },
);
