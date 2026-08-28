import { uniqueNormalizedTagNames } from '../../tags/domain/tag-values'
import type { BookmarkSearchSchema } from './bookmark-search'
import { defaultBookmarkSearch } from './bookmark-search'

const listDefaults: BookmarkSearchSchema = {
  tagMode: 'and',
  sort: 'newest'
}

export type BookmarkSearchPatch = {
  readonly q?: string | undefined
  readonly tags?: string[] | undefined
  readonly tagMode?: BookmarkSearchSchema['tagMode'] | undefined
  readonly sort?: BookmarkSearchSchema['sort'] | undefined
  readonly clearQ?: boolean
  readonly clearTags?: boolean
}

export type BookmarkDetailSearch = {
  readonly q?: string | undefined
  readonly tags?: string[] | undefined
  readonly tagMode?: BookmarkSearchSchema['tagMode'] | undefined
  readonly sort?: BookmarkSearchSchema['sort'] | undefined
}

function resolveSearchPatch<T>(
  clear: boolean | undefined,
  patchValue: T | undefined,
  currentValue: T | undefined
): T | undefined {
  if (clear) {
    return undefined
  }
  if (patchValue !== undefined) {
    return patchValue
  }
  return currentValue
}

export function buildListSearch(
  current: BookmarkSearchSchema,
  patch: BookmarkSearchPatch
): BookmarkSearchSchema {
  const next: BookmarkSearchSchema = {
    tagMode: patch.tagMode ?? current.tagMode,
    sort: patch.sort ?? current.sort
  }

  const q = resolveSearchPatch(patch.clearQ, patch.q, current.q)
  const tags = resolveSearchPatch(patch.clearTags, patch.tags, current.tags)

  if (q !== undefined && q !== '') {
    next.q = q
  }
  if (tags !== undefined && tags.length > 0) {
    const canonicalTags = uniqueNormalizedTagNames(tags)
    if (canonicalTags.length > 0) {
      next.tags = canonicalTags
    }
  }

  return next
}

export function buildListBackSearch(tags?: readonly string[]): BookmarkSearchSchema {
  return listSearchFromDetail({ tags: tags === undefined ? undefined : [...tags] })
}

export function listSearchFromDetail(search: BookmarkDetailSearch): BookmarkSearchSchema {
  return buildListSearch(defaultBookmarkSearch, {
    q: search.q,
    tags: search.tags,
    tagMode: search.tagMode,
    sort: search.sort,
    clearQ: search.q === undefined,
    clearTags: search.tags === undefined || search.tags.length === 0
  })
}

export function detailSearchFromList(search: BookmarkSearchSchema): BookmarkDetailSearch {
  return {
    ...(search.q !== undefined && search.q !== '' ? { q: search.q } : {}),
    ...(search.tags !== undefined && search.tags.length > 0 ? { tags: search.tags } : {}),
    ...(search.tagMode !== 'and' ? { tagMode: search.tagMode } : {}),
    ...(search.sort !== 'newest' ? { sort: search.sort } : {})
  }
}

export function allShelfSearch(current?: BookmarkSearchSchema): BookmarkSearchSchema {
  return buildListSearch(current ?? listDefaults, { clearTags: true })
}

export function tagShelfSearch(
  tagName: string,
  current?: BookmarkSearchSchema
): BookmarkSearchSchema {
  return buildListSearch(current ?? listDefaults, { tags: [tagName] })
}

export function chromeListSearch(
  indexSearch: BookmarkSearchSchema | undefined,
  tagCarriers: ReadonlyArray<{ tags?: readonly string[] | undefined } | undefined>
): BookmarkSearchSchema | undefined {
  if (indexSearch !== undefined) {
    return indexSearch
  }

  for (const carrier of tagCarriers) {
    const tags = carrier?.tags
    if (tags !== undefined && tags.length > 0) {
      const canonicalTags = uniqueNormalizedTagNames([...tags])
      if (canonicalTags.length > 0) {
        return {
          ...defaultBookmarkSearch,
          tags: canonicalTags
        }
      }
    }
  }

  return undefined
}

export function resolveChromeListSearch(
  indexSearch: BookmarkSearchSchema | undefined,
  remembered: BookmarkSearchSchema | undefined,
  tagCarriers: ReadonlyArray<{ tags?: readonly string[] | undefined } | undefined>
): BookmarkSearchSchema | undefined {
  if (indexSearch !== undefined) {
    return indexSearch
  }
  if (remembered !== undefined) {
    return remembered
  }
  return chromeListSearch(undefined, tagCarriers)
}
