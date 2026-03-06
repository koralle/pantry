import type { z } from "zod";
import { TagsApiSuggestQueryParams } from "../generated/tags/tags.zod";
import type { SuggestTagsOk } from "../generated/schemas";

export type SuggestTagsInput = z.output<typeof TagsApiSuggestQueryParams>;
export type SuggestTagsOutput = SuggestTagsOk;

export interface TagsService {
  suggestTags(input: SuggestTagsInput): Promise<SuggestTagsOutput>;
}

export const createTagsService = (): TagsService => ({
  async suggestTags() {
    return {
      items: [],
    };
  },
});
