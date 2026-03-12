import { createFactory } from "hono/factory";
import { type AppEnv, getAppDependency } from "../dependencies";
import type { BookmarksApiCreateContext } from "../generated/bookmarks/bookmarks.context";
import { parseJson } from "../http/validation";
import { parseCreateBookmarkBody } from "../validation/bookmarks";
import { toCreateBookmarkApiResponse, toCreateBookmarkServiceInput } from "./bookmarks.mapper";

const factory = createFactory();

export const bookmarksApiCreateHandlers = factory.createHandlers(
  async (c: BookmarksApiCreateContext<AppEnv>) => {
    const bookmarksService = getAppDependency(c, "bookmarksService");
    const body = parseCreateBookmarkBody(await parseJson(c.req.raw));
    const serviceInput = toCreateBookmarkServiceInput(body);
    const result = await bookmarksService.create(serviceInput);
    const response = toCreateBookmarkApiResponse(result);

    return c.json(response, 201);
  },
);
