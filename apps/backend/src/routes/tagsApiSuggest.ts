import { createFactory } from "hono/factory";
import { zValidator } from "../generated/validator";
import { TagsApiSuggestContext } from "../generated/tags/tags.context";
import { TagsApiSuggestQueryParams, TagsApiSuggestResponse } from "../generated/tags/tags.zod";

const factory = createFactory();
export const tagsApiSuggestHandlers = factory.createHandlers(
  zValidator("query", TagsApiSuggestQueryParams),
  zValidator("response", TagsApiSuggestResponse),
  async (c: TagsApiSuggestContext) => {},
);
