import { createFactory } from "hono/factory";
import { type AppEnv, getAppDependency } from "../dependencies";
import type { BookmarksApiCreateContext } from "../generated/bookmarks/bookmarks.context";
import { BookmarksApiCreateBody } from "../generated/bookmarks/bookmarks.zod";
import { zValidator } from "../generated/validator";
import { toCreateBookmarkApiResponse, toCreateBookmarkServiceInput } from "./bookmarks.mapper";

const factory = createFactory();

export const bookmarksApiCreateHandlers = factory.createHandlers(
  zValidator("json", BookmarksApiCreateBody),
  async (c: BookmarksApiCreateContext<AppEnv>) => {
    const bookmarksService = getAppDependency(c, "bookmarksService");
    const body = c.req.valid("json");
    const serviceInput = toCreateBookmarkServiceInput(body);
    const result = await bookmarksService.create(serviceInput);
    const response = toCreateBookmarkApiResponse(result);

    return c.json(response, 201);
  },
);
