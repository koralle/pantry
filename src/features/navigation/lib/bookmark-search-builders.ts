import { uniqueNormalizedTagNames } from "../../tags/domain/tag-values";
import type {
  BookmarkDetailSearch,
  BookmarkSearchSchema,
} from "./bookmark-search";
import { defaultBookmarkSearch } from "./bookmark-search";

export interface BookmarkSearchPatch {
  readonly layout?: BookmarkSearchSchema["layout"] | undefined;
  readonly tags?: string[] | undefined;
  readonly view?: BookmarkSearchSchema["view"] | undefined;
  readonly clearTags?: boolean;
}

export const buildListSearch = (
  current: BookmarkSearchSchema,
  patch: BookmarkSearchPatch
): BookmarkSearchSchema => {
  const next: BookmarkSearchSchema = {};

  const view = patch.view ?? current.view;
  if (view !== undefined && view !== "recent") {
    next.view = view;
  }

  const layout = patch.layout ?? current.layout;
  if (layout === "cards") {
    next.layout = "cards";
  }

  const tags = patch.clearTags ? undefined : (patch.tags ?? current.tags);

  if (tags !== undefined && tags.length > 0) {
    const canonicalTags = uniqueNormalizedTagNames(tags);
    if (canonicalTags.length > 0) {
      next.tags = canonicalTags;
    }
  }

  return next;
};

export const buildListBackSearch = (
  tags?: readonly string[],
  current?: BookmarkSearchSchema
): BookmarkSearchSchema =>
  buildListSearch(current ?? defaultBookmarkSearch, {
    tags: tags === undefined ? undefined : [...tags],
    view: "recent",
  });

export const listSearchFromDetail = (
  search: BookmarkDetailSearch
): BookmarkSearchSchema =>
  buildListSearch(defaultBookmarkSearch, {
    clearTags: search.tags === undefined || search.tags.length === 0,
    layout: search.layout,
    tags: search.tags,
    view: search.view,
  });

export const detailSearchFromList = (
  search: BookmarkSearchSchema
): BookmarkDetailSearch => ({
  ...(search.layout === "cards" ? { layout: "cards" as const } : {}),
  ...(search.tags !== undefined && search.tags.length > 0
    ? { tags: search.tags }
    : {}),
  ...(search.view === undefined || search.view === "recent"
    ? {}
    : { view: search.view }),
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
