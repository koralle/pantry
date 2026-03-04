import { createFactory } from "hono/factory";
import { zValidator } from "../generated/validator";
import { BookmarksApiCreateContext } from "../generated/bookmarks/bookmarks.context";
import { BookmarksApiCreateBody } from "../generated/bookmarks/bookmarks.zod";

const factory = createFactory();
export const bookmarksApiCreateHandlers = factory.createHandlers(
  zValidator("json", BookmarksApiCreateBody),
  async (c: BookmarksApiCreateContext) => {},
);
