import { createFactory } from "hono/factory";
import { zValidator } from "../generated/validator";
import { BookmarksApiGetContext } from "../generated/bookmarks/bookmarks.context";
import {
  BookmarksApiGetParams,
  BookmarksApiGetResponse,
} from "../generated/bookmarks/bookmarks.zod";
import { getAppDependency } from "../dependencies";

const factory = createFactory();
export const bookmarksApiGetHandlers = factory.createHandlers(
  zValidator("param", BookmarksApiGetParams),
  zValidator("response", BookmarksApiGetResponse),
  async (c: BookmarksApiGetContext) => {
    const bookmarksService = getAppDependency(c, "bookmarksService");
    const params = c.req.valid("param");
    const result = await bookmarksService.get(params);

    return c.json(result);
  },
);
