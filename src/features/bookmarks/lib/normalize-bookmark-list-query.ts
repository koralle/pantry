export type FetchBookmarksInput = {
  q?: string
  tagNames?: string[]
  tagMode: 'and' | 'or'
  sort: 'newest' | 'updated'
  limit: number
  offset: number
}

export function normalizeListQuery(input: FetchBookmarksInput): FetchBookmarksInput {
  const q = input.q?.trim()
  const tagNames = [
    ...new Set((input.tagNames ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean))
  ]

  const normalized: FetchBookmarksInput = {
    tagMode: input.tagMode,
    sort: input.sort,
    limit: input.limit,
    offset: input.offset
  }

  if (q) {
    normalized.q = q
  }

  if (tagNames.length > 0) {
    normalized.tagNames = tagNames
  }

  return normalized
}
