import { createFactory } from "hono/factory";
import { type AppEnv, getAppDependency } from "../dependencies";
import type { BookmarksApiUpdateContext } from "../generated/bookmarks/bookmarks.context";
import { BookmarksApiUpdateResponse } from "../generated/bookmarks/bookmarks.zod";
import { zValidator } from "../generated/validator";
import { parseJson } from "../http/validation";
import { parseBookmarkId, parseUpdateBookmarkBody } from "../validation/bookmarks";
import { toUpdateBookmarkApiResponse, toUpdateBookmarkServiceInput } from "./bookmarks.mapper";

const factory = createFactory();
export const bookmarksApiUpdateHandlers = factory.createHandlers(
  zValidator("response", BookmarksApiUpdateResponse),
  async (c: BookmarksApiUpdateContext<AppEnv>) => {
    const bookmarksService = getAppDependency(c, "bookmarksService");
    const bookmarkId = parseBookmarkId(c.req.param("bookmarkId"));
    const body = parseUpdateBookmarkBody(await parseJson(c.req.raw));
    const serviceInput = toUpdateBookmarkServiceInput({ bookmarkId }, body);
    const result = await bookmarksService.update(serviceInput);
    const response = toUpdateBookmarkApiResponse(result);

    return c.json(response);
  },
);
