import { AppError } from './error'

const CURSOR_VERSION = 1

interface CursorData {
  v: number
  sort: string
  filterHash: string
  lastKey: string
  lastId: string
}

export function encodeCursor(data: CursorData): string {
  return btoa(JSON.stringify(data))
}

export function decodeCursor(
  raw: string,
  sort: string,
  filterHash: string
): { lastKey: string; lastId: string } {
  let data: CursorData
  try {
    data = JSON.parse(atob(raw))
  } catch {
    throw new AppError(400, 'INVALID_CURSOR', 'Malformed cursor')
  }

  if (data.v !== CURSOR_VERSION) {
    throw new AppError(400, 'INVALID_CURSOR', 'Unknown cursor version')
  }
  if (data.sort !== sort) {
    throw new AppError(400, 'CURSOR_MISMATCH', 'Sort parameter changed')
  }
  if (data.filterHash !== filterHash) {
    throw new AppError(400, 'CURSOR_MISMATCH', 'Filter parameters changed')
  }

  return { lastId: data.lastId, lastKey: data.lastKey }
}

export function computeFilterHash(params: Record<string, string | undefined>): string {
  const keys = Object.keys(params).toSorted()
  const parts = keys.map((k) => `${k}=${params[k] ?? ''}`).join('&')
  let hash = 0
  for (let i = 0; i < parts.length; i++) {
    const char = parts.codePointAt(i) ?? 0
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return hash.toString(36)
}
