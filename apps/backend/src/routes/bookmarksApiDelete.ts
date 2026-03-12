import { createFactory } from "hono/factory";
import { type AppEnv, getAppDependency } from "../dependencies";
import type { BookmarksApiDeleteContext } from "../generated/bookmarks/bookmarks.context";
import { parseBookmarkId } from "../validation/bookmarks";
import { toDeleteBookmarkServiceInput } from "./bookmarks.mapper";

const factory = createFactory();
export const bookmarksApiDeleteHandlers = factory.createHandlers(
  async (c: BookmarksApiDeleteContext<AppEnv>) => {
    const bookmarksService = getAppDependency(c, "bookmarksService");
    const bookmarkId = parseBookmarkId(c.req.param("bookmarkId"));
    const serviceInput = toDeleteBookmarkServiceInput({ bookmarkId });
    await bookmarksService.delete(serviceInput);

    return c.body(null, 204);
  },
);
