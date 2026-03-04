import { createFactory } from "hono/factory";
import { zValidator } from "../generated/validator";
import { BookmarksApiUpdateContext } from "../generated/bookmarks/bookmarks.context";
import {
  BookmarksApiUpdateParams,
  BookmarksApiUpdateBody,
  BookmarksApiUpdateResponse,
} from "../generated/bookmarks/bookmarks.zod";
import { getAppDependency } from "../dependencies";

const factory = createFactory();
export const bookmarksApiUpdateHandlers = factory.createHandlers(
  zValidator("param", BookmarksApiUpdateParams),
  zValidator("json", BookmarksApiUpdateBody),
  zValidator("response", BookmarksApiUpdateResponse),
  async (c: BookmarksApiUpdateContext) => {
    const bookmarksService = getAppDependency(c, "bookmarksService");
    const params = c.req.valid("param");
    const body = c.req.valid("json");
    const result = await bookmarksService.update({
      ...params,
      ...body,
    });

    return c.json(result);
  },
);
