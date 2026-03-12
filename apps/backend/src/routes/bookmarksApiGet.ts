import { createFactory } from "hono/factory";
import { type AppEnv, getAppDependency } from "../dependencies";
import type { BookmarksApiGetContext } from "../generated/bookmarks/bookmarks.context";
import { BookmarksApiGetResponse } from "../generated/bookmarks/bookmarks.zod";
import { zValidator } from "../generated/validator";
import { parseBookmarkId } from "../validation/bookmarks";
import { toGetBookmarkApiResponse, toGetBookmarkServiceInput } from "./bookmarks.mapper";

const factory = createFactory();
export const bookmarksApiGetHandlers = factory.createHandlers(
  zValidator("response", BookmarksApiGetResponse),
  async (c: BookmarksApiGetContext<AppEnv>) => {
    const bookmarksService = getAppDependency(c, "bookmarksService");
    const bookmarkId = parseBookmarkId(c.req.param("bookmarkId"));
    const serviceInput = toGetBookmarkServiceInput({ bookmarkId });
    const result = await bookmarksService.get(serviceInput);
    const response = toGetBookmarkApiResponse(result);

    return c.json(response);
  },
);
