export type ShelfTag = {
  id: number
  name: string
  pinned: boolean
  sortOrder: number
  color: string | null
  lastUsedAt: Date | null
  bookmarkCount: number
}

/**
 * タグ詳細・編集画面の写像。DB 行の残り（userId、正規化名、監査列）は載せない。
 */
export type TagRecord = {
  id: number
  name: string
  pinned: boolean
  sortOrder: number
  color: string | null
}

function compareName(a: { name: string }, b: { name: string }): number {
  return a.name.localeCompare(b.name)
}

export function sortTagsForNav<T extends { pinned: boolean; sortOrder: number; name: string }>(
  tags: readonly T[]
): T[] {
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
