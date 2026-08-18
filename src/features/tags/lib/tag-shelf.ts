export type ShelfTag = {
  id: number
  name: string
  pinned: boolean
  sortOrder: number
  color: string | null
  lastUsedAt: Date | null
  bookmarkCount: number
}

function compareName(a: ShelfTag, b: ShelfTag): number {
  return a.name.localeCompare(b.name)
}

export function sortTagsForNav(tags: ShelfTag[]): ShelfTag[] {
  return [...tags].toSorted((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1
    }
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder
    }
    return compareName(a, b)
  })
}
