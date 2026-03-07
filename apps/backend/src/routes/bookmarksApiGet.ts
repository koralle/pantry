import { createFactory } from "hono/factory";
import { zValidator } from "../generated/validator";
import { BookmarksApiGetContext } from "../generated/bookmarks/bookmarks.context";
import {
  BookmarksApiGetParams,
  BookmarksApiGetResponse,
} from "../generated/bookmarks/bookmarks.zod";
import { AppEnv, getAppDependency } from "../dependencies";
import { toGetBookmarkApiResponse, toGetBookmarkServiceInput } from "./bookmarks.mapper";

const factory = createFactory();
export const bookmarksApiGetHandlers = factory.createHandlers(
  zValidator("param", BookmarksApiGetParams),
  zValidator("response", BookmarksApiGetResponse),
  async (c: BookmarksApiGetContext<AppEnv>) => {
    const bookmarksService = getAppDependency(c, "bookmarksService");
    const params = c.req.valid("param");
    const serviceInput = toGetBookmarkServiceInput(params);
    const result = await bookmarksService.get(serviceInput);
    const response = toGetBookmarkApiResponse(result);

    return c.json(response);
  },
);
