import { createFactory } from "hono/factory";
import { zValidator } from "../generated/validator";
import { BookmarksApiCreateContext } from "../generated/bookmarks/bookmarks.context";
import { BookmarksApiCreateBody } from "../generated/bookmarks/bookmarks.zod";
import { getAppDependency } from "../dependencies";

const factory = createFactory();
export const bookmarksApiCreateHandlers = factory.createHandlers(
  zValidator("json", BookmarksApiCreateBody),
  async (c: BookmarksApiCreateContext) => {
    const bookmarksService = getAppDependency(c, "bookmarksService");
    const body = c.req.valid("json");
    const result = await bookmarksService.create(body);

    return c.json(result, 201);
  },
);
