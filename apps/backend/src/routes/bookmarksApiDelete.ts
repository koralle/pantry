import { createFactory } from "hono/factory";
import { zValidator } from "../generated/validator";
import { BookmarksApiDeleteContext } from "../generated/bookmarks/bookmarks.context";
import { BookmarksApiDeleteParams } from "../generated/bookmarks/bookmarks.zod";

const factory = createFactory();
export const bookmarksApiDeleteHandlers = factory.createHandlers(
  zValidator("param", BookmarksApiDeleteParams),
  async (c: BookmarksApiDeleteContext) => {},
);
