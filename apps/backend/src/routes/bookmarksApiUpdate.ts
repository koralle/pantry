import { createFactory } from "hono/factory";
import { zValidator } from "../generated/validator";
import { BookmarksApiUpdateContext } from "../generated/bookmarks/bookmarks.context";
import {
  BookmarksApiUpdateParams,
  BookmarksApiUpdateBody,
  BookmarksApiUpdateResponse,
} from "../generated/bookmarks/bookmarks.zod";

const factory = createFactory();
export const bookmarksApiUpdateHandlers = factory.createHandlers(
  zValidator("param", BookmarksApiUpdateParams),
  zValidator("json", BookmarksApiUpdateBody),
  zValidator("response", BookmarksApiUpdateResponse),
  async (c: BookmarksApiUpdateContext) => {},
);
