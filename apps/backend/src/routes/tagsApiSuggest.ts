import { createFactory } from "hono/factory";
import { type AppEnv, getAppDependency } from "../dependencies";
import type { TagsApiSuggestContext } from "../generated/tags/tags.context";
import { TagsApiSuggestResponse, tagsApiSuggestQueryLimitDefault } from "../generated/tags/tags.zod";
import { zValidator } from "../generated/validator";
import { parseSuggestTagsQuery } from "../validation/tags";

const factory = createFactory();
export const tagsApiSuggestHandlers = factory.createHandlers(
  zValidator("response", TagsApiSuggestResponse),
  async (c: TagsApiSuggestContext<AppEnv>) => {
    const tagsService = getAppDependency(c, "tagsService");
    const query = parseSuggestTagsQuery(c.req.url);
    const result = await tagsService.suggestTags({
      ...query,
      limit: query.limit ?? tagsApiSuggestQueryLimitDefault,
    });

    return c.json(result);
  },
);
