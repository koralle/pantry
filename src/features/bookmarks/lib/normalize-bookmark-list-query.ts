import { uniqueNormalizedTagNames } from '../../tags/domain/tag-values'

export type FetchBookmarksInput = {
  q?: string
  tagNames?: string[]
  tagMode: 'and' | 'or'
  sort: 'newest' | 'updated'
  cursor?: string | undefined
}

export function normalizeListQuery(input: FetchBookmarksInput): FetchBookmarksInput {
  const q = input.q?.trim()
  const tagNames = uniqueNormalizedTagNames(input.tagNames ?? [])

  const normalized: FetchBookmarksInput = {
    tagMode: input.tagMode,
    sort: input.sort
  }

  if (q) {
    normalized.q = q
  }

  if (tagNames.length > 0) {
    normalized.tagNames = tagNames
  }

  if (input.cursor !== undefined && input.cursor !== '') {
    normalized.cursor = input.cursor
  }

  return normalized
}
