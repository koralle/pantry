import { createFactory } from "hono/factory";
import { type AppEnv, getAppDependency } from "../dependencies";
import type { TagsApiSuggestContext } from "../generated/tags/tags.context";
import {
  TagsApiSuggestQueryParams,
  TagsApiSuggestResponse,
  tagsApiSuggestQueryLimitDefault,
} from "../generated/tags/tags.zod";
import { zValidator } from "../generated/validator";

const factory = createFactory();
export const tagsApiSuggestHandlers = factory.createHandlers(
  zValidator("query", TagsApiSuggestQueryParams),
  zValidator("response", TagsApiSuggestResponse),
  async (c: TagsApiSuggestContext<AppEnv>) => {
    const tagsService = getAppDependency(c, "tagsService");
    const query = c.req.valid("query");
    const result = await tagsService.suggestTags({
      ...query,
      limit: query.limit ?? tagsApiSuggestQueryLimitDefault,
    });

    return c.json(result);
  },
);
