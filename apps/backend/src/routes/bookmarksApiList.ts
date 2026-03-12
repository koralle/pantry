import { createFactory } from "hono/factory";
import { type AppEnv, getAppDependency } from "../dependencies";
import type { BookmarksApiListContext } from "../generated/bookmarks/bookmarks.context";
import { BookmarksApiListResponse, bookmarksApiListQueryLimitDefault } from "../generated/bookmarks/bookmarks.zod";
import { zValidator } from "../generated/validator";
import { parseListBookmarksQuery } from "../validation/bookmarks";
import { toListBookmarksApiResponse, toListBookmarksServiceInput } from "./bookmarks.mapper";

const factory = createFactory();

export const bookmarksApiListHandlers = factory.createHandlers(
  zValidator("response", BookmarksApiListResponse),
  async (c: BookmarksApiListContext<AppEnv>) => {
    const bookmarksService = getAppDependency(c, "bookmarksService");
    const query = parseListBookmarksQuery(c.req.url);
    const serviceInput = toListBookmarksServiceInput(query, bookmarksApiListQueryLimitDefault);
    const result = await bookmarksService.list(serviceInput);
    const response = toListBookmarksApiResponse(result);

    return c.json(response);
  },
);
