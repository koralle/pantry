import { createFactory } from "hono/factory";
import { zValidator } from "../generated/validator";
import { BookmarksApiListContext } from "../generated/bookmarks/bookmarks.context";
import {
  BookmarksApiListQueryParams,
  BookmarksApiListResponse,
  bookmarksApiListQueryLimitDefault,
} from "../generated/bookmarks/bookmarks.zod";
import { AppEnv, getAppDependency } from "../dependencies";
import {
  toListBookmarksApiResponse,
  toListBookmarksServiceInput,
} from "./bookmarks.mapper";

const factory = createFactory();

export const bookmarksApiListHandlers = factory.createHandlers(
  zValidator("query", BookmarksApiListQueryParams),
  zValidator("response", BookmarksApiListResponse),
  async (c: BookmarksApiListContext<AppEnv>) => {
    const bookmarksService = getAppDependency(c, "bookmarksService");
    const query = c.req.valid("query");
    const serviceInput = toListBookmarksServiceInput(
      query,
      bookmarksApiListQueryLimitDefault,
    );
    const result = await bookmarksService.list(serviceInput);
    const response = toListBookmarksApiResponse(result);

    return c.json(response);
  },
);
