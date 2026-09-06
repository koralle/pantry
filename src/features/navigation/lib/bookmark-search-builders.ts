import { uniqueNormalizedTagNames } from "../../tags/domain/tag-values";
import type {
  BookmarkDetailSearch,
  BookmarkSearchSchema,
} from "./bookmark-search";
import { defaultBookmarkSearch } from "./bookmark-search";

export interface BookmarkSearchPatch {
  readonly q?: string | undefined;
  readonly tags?: string[] | undefined;
  readonly tagMode?: BookmarkSearchSchema["tagMode"] | undefined;
  readonly sort?: BookmarkSearchSchema["sort"] | undefined;
  readonly clearQ?: boolean;
  readonly clearTags?: boolean;
}

const resolveSearchPatch = <T>(
  clear: boolean | undefined,
  patchValue: T | undefined,
  currentValue: T | undefined
): T | undefined => {
  if (clear) {
    return undefined;
  }
  if (patchValue !== undefined) {
    return patchValue;
  }
  return currentValue;
};

export const buildListSearch = (
  current: BookmarkSearchSchema,
  patch: BookmarkSearchPatch
): BookmarkSearchSchema => {
  const next: BookmarkSearchSchema = {
    sort: patch.sort ?? current.sort,
    tagMode: patch.tagMode ?? current.tagMode,
  };

  const q = resolveSearchPatch(patch.clearQ, patch.q, current.q);
  const tags = resolveSearchPatch(patch.clearTags, patch.tags, current.tags);

  if (q !== undefined && q !== "") {
    next.q = q;
  }
  if (tags !== undefined && tags.length > 0) {
    const canonicalTags = uniqueNormalizedTagNames(tags);
    if (canonicalTags.length > 0) {
      next.tags = canonicalTags;
    }
  }

  return next;
};

export const buildListBackSearch = (
  tags?: readonly string[]
): BookmarkSearchSchema =>
  listSearchFromDetail({
    tags: tags === undefined ? undefined : [...tags],
  });

export const listSearchFromDetail = (
  search: BookmarkDetailSearch
): BookmarkSearchSchema =>
  buildListSearch(defaultBookmarkSearch, {
    clearQ: search.q === undefined,
    clearTags: search.tags === undefined || search.tags.length === 0,
    q: search.q,
    sort: search.sort,
    tagMode: search.tagMode,
    tags: search.tags,
  });

export const detailSearchFromList = (
  search: BookmarkSearchSchema
): BookmarkDetailSearch => ({
  ...(search.q !== undefined && search.q !== "" ? { q: search.q } : {}),
  ...(search.tags !== undefined && search.tags.length > 0
    ? { tags: search.tags }
    : {}),
  ...(search.tagMode === "and" ? {} : { tagMode: search.tagMode }),
  ...(search.sort === "newest" ? {} : { sort: search.sort }),
});

export const allShelfSearch = (
  current?: BookmarkSearchSchema
): BookmarkSearchSchema =>
  buildListSearch(current ?? defaultBookmarkSearch, { clearTags: true });

export const tagShelfSearch = (
  tagName: string,
  current?: BookmarkSearchSchema
): BookmarkSearchSchema =>
  buildListSearch(current ?? defaultBookmarkSearch, { tags: [tagName] });

export const chromeListSearch = (
  indexSearch: BookmarkSearchSchema | undefined,
  tagCarriers: readonly ({ tags?: readonly string[] | undefined } | undefined)[]
): BookmarkSearchSchema | undefined => {
  if (indexSearch !== undefined) {
    return indexSearch;
  }

  for (const carrier of tagCarriers) {
    const tags = carrier?.tags;
    if (tags !== undefined && tags.length > 0) {
      const canonicalTags = uniqueNormalizedTagNames([...tags]);
      if (canonicalTags.length > 0) {
        return {
          ...defaultBookmarkSearch,
          tags: canonicalTags,
        };
      }
    }
  }

  return undefined;
};

export const resolveChromeListSearch = (
  indexSearch: BookmarkSearchSchema | undefined,
  remembered: BookmarkSearchSchema | undefined,
  tagCarriers: readonly ({ tags?: readonly string[] | undefined } | undefined)[]
): BookmarkSearchSchema | undefined => {
  if (indexSearch !== undefined) {
    return indexSearch;
  }
  if (remembered !== undefined) {
    return remembered;
  }
  return chromeListSearch(undefined, tagCarriers);
};
