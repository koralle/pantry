import { uniqueNormalizedTagNames } from "../../../tags/domain/tag-values";

export interface FetchBookmarksInput {
  q?: string;
  tagNames?: string[];
  cursor?: string | undefined;
  view?: "recent" | "inbox" | "favorites" | undefined;
}

export const normalizeListQuery = (
  input: FetchBookmarksInput
): FetchBookmarksInput => {
  const q = input.q?.trim();
  const tagNames = uniqueNormalizedTagNames(input.tagNames ?? []);

  const normalized: FetchBookmarksInput = {};

  if (q) {
    normalized.q = q;
  }

  if (tagNames.length > 0) {
    normalized.tagNames = tagNames;
  }

  if (input.cursor !== undefined && input.cursor !== "") {
    normalized.cursor = input.cursor;
  }

  if (input.view !== undefined && input.view !== "recent") {
    normalized.view = input.view;
  }

  return normalized;
};
