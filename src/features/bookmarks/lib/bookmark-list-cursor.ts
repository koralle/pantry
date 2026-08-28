import * as v from 'valibot'

import { bookmarkIdSchema } from '../domain/bookmark-values'

export type BookmarkListCursor = {
  readonly sortValueMs: number
  readonly id: string
}

const CURSOR_PATTERN = /^(?<sortValueMs>\d+):(?<id>.+)$/

function parseCursorSortValueMs(value: string | undefined): number | null {
  if (value === undefined) {
    return null
  }
  const sortValueMs = Number(value)
  if (!Number.isSafeInteger(sortValueMs) || new Date(sortValueMs).getTime() !== sortValueMs) {
    return null
  }
  return sortValueMs
}

function parseCursorBookmarkId(value: string | undefined): string | null {
  if (value === undefined) {
    return null
  }
  const parsedId = v.safeParse(bookmarkIdSchema, value)
  return parsedId.success ? parsedId.output : null
}

export function decodeBookmarkListCursor(value: string): BookmarkListCursor | null {
  const matched = CURSOR_PATTERN.exec(value)
  if (matched === null) {
    return null
  }

  const sortValueMs = parseCursorSortValueMs(matched.groups?.['sortValueMs'])
  const id = parseCursorBookmarkId(matched.groups?.['id'])
  if (sortValueMs === null || id === null) {
    return null
  }

  return { sortValueMs, id }
}

export function encodeBookmarkListCursor(cursor: BookmarkListCursor): string {
  return `${cursor.sortValueMs}:${cursor.id}`
}
