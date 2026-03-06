import { createFactory } from "hono/factory";
import { zValidator } from "../generated/validator";
import { TagsApiSuggestContext } from "../generated/tags/tags.context";
import {
  TagsApiSuggestQueryParams,
  TagsApiSuggestResponse,
  tagsApiSuggestQueryLimitDefault,
} from "../generated/tags/tags.zod";
import { AppEnv, getAppDependency } from "../dependencies";

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
