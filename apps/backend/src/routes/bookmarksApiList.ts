import { createFactory } from "hono/factory";
import { zValidator } from "../generated/validator";
import { BookmarksApiListContext } from "../generated/bookmarks/bookmarks.context";
import {
  BookmarksApiListQueryParams,
  BookmarksApiListResponse,
  bookmarksApiListQueryLimitDefault,
} from "../generated/bookmarks/bookmarks.zod";
import { getAppDependency } from "../dependencies";

const factory = createFactory();

export const bookmarksApiListHandlers = factory.createHandlers(
  zValidator("query", BookmarksApiListQueryParams),
  zValidator("response", BookmarksApiListResponse),
  async (c: BookmarksApiListContext) => {
    const bookmarksService = getAppDependency(c, "bookmarksService");
    const query = c.req.valid("query");
    const result = await bookmarksService.list({
      ...query,
      limit: query.limit ?? bookmarksApiListQueryLimitDefault,
    });

    return c.json(result);
  },
);
