import { uuidv7 } from 'uuidv7'
import * as v from 'valibot'

import { userIdSchema } from '../../auth/domain/auth-values'
import type { UserId } from '../../auth/domain/auth-values'
import { tagIdSchema, tagNameSchema } from '../../tags/domain/tag-values'
import type { TagId, TagName } from '../../tags/domain/tag-values'
import {
  bookmarkIdSchema,
  bookmarkNoteSchema,
  bookmarkTitleSchema,
  bookmarkUrlSchema
} from '../domain/bookmark-values'
import type {
  BookmarkId,
  BookmarkNote,
  BookmarkTitle,
  BookmarkUrl
} from '../domain/bookmark-values'

export function bookmarkId(value: string = uuidv7()): BookmarkId {
  return v.parse(bookmarkIdSchema, value)
}

export function bookmarkUrl(value: string): BookmarkUrl {
  return v.parse(bookmarkUrlSchema, value)
}

export function bookmarkTitle(value: string): BookmarkTitle {
  return v.parse(bookmarkTitleSchema, value)
}

export function bookmarkNote(value: string | null): BookmarkNote {
  return v.parse(bookmarkNoteSchema, value)
}

export function tagId(value: number): TagId {
  return v.parse(tagIdSchema, value)
}

export function tagName(value: string): TagName {
  return v.parse(tagNameSchema, value)
}

export function userId(value: string): UserId {
  return v.parse(userIdSchema, value)
}

/** Promise ベースの drizzle 風チェーン。任意の末端で await できるようにする。 */
export function createThenableChain<T>(result: T | Promise<T>) {
  const chain = Promise.resolve(result) as Promise<T> & Record<string, () => unknown>
  const methods = [
    'from',
    'where',
    'limit',
    'offset',
    'orderBy',
    'set',
    'values',
    'returning',
    'innerJoin',
    'leftJoin'
  ] as const

  for (const method of methods) {
    chain[method] = () => chain
  }

  return chain
}
