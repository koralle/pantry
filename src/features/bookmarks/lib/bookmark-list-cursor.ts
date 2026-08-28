export type BookmarkListCursor = {
  readonly sortValueMs: number
  readonly id: string
}

const CURSOR_PATTERN = /^(\d+):(.+)$/

export function encodeBookmarkListCursor(cursor: BookmarkListCursor): string {
  return `${cursor.sortValueMs}:${cursor.id}`
}

export function decodeBookmarkListCursor(value: string): BookmarkListCursor | null {
  const matched = CURSOR_PATTERN.exec(value)
  if (matched == null) {
    return null
  }

  const sortValueMs = Number(matched[1])
  const id = matched[2]
  if (!Number.isSafeInteger(sortValueMs) || id === undefined || id.length === 0) {
    return null
  }

  return { sortValueMs, id }
}
