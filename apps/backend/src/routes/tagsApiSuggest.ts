import { createFactory } from "hono/factory";
import { zValidator } from "../generated/validator";
import { TagsApiSuggestContext } from "../generated/tags/tags.context";
import {
  TagsApiSuggestQueryParams,
  TagsApiSuggestResponse,
  tagsApiSuggestQueryLimitDefault,
} from "../generated/tags/tags.zod";
import { getAppDependency } from "../dependencies";

const factory = createFactory();
export const tagsApiSuggestHandlers = factory.createHandlers(
  zValidator("query", TagsApiSuggestQueryParams),
  zValidator("response", TagsApiSuggestResponse),
  async (c: TagsApiSuggestContext) => {
    const bookmarksService = getAppDependency(c, "bookmarksService");
    const query = c.req.valid("query");
    const result = await bookmarksService.suggestTags({
      ...query,
      limit: query.limit ?? tagsApiSuggestQueryLimitDefault,
    });

    return c.json(result);
  },
);
