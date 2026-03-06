import { createFactory } from "hono/factory";
import { zValidator } from "../generated/validator";
import { BookmarksApiUpdateContext } from "../generated/bookmarks/bookmarks.context";
import {
  BookmarksApiUpdateParams,
  BookmarksApiUpdateBody,
  BookmarksApiUpdateResponse,
} from "../generated/bookmarks/bookmarks.zod";
import { AppEnv, getAppDependency } from "../dependencies";
import {
  toUpdateBookmarkApiResponse,
  toUpdateBookmarkServiceInput,
} from "./bookmarks.mapper";

const factory = createFactory();
export const bookmarksApiUpdateHandlers = factory.createHandlers(
  zValidator("param", BookmarksApiUpdateParams),
  zValidator("json", BookmarksApiUpdateBody),
  zValidator("response", BookmarksApiUpdateResponse),
  async (c: BookmarksApiUpdateContext<AppEnv>) => {
    const bookmarksService = getAppDependency(c, "bookmarksService");
    const params = c.req.valid("param");
    const body = c.req.valid("json");
    const serviceInput = toUpdateBookmarkServiceInput(params, body);
    const result = await bookmarksService.update(serviceInput);
    const response = toUpdateBookmarkApiResponse(result);

    return c.json(response);
  },
);
