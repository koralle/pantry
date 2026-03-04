import { createFactory } from "hono/factory";
import { zValidator } from "../generated/validator";
import { BookmarksApiDeleteContext } from "../generated/bookmarks/bookmarks.context";
import { BookmarksApiDeleteParams } from "../generated/bookmarks/bookmarks.zod";
import { getAppDependency } from "../dependencies";

const factory = createFactory();
export const bookmarksApiDeleteHandlers = factory.createHandlers(
  zValidator("param", BookmarksApiDeleteParams),
  async (c: BookmarksApiDeleteContext) => {
    const bookmarksService = getAppDependency(c, "bookmarksService");
    const params = c.req.valid("param");
    await bookmarksService.delete(params);

    return c.body(null, 204);
  },
);
