import { eq } from 'drizzle-orm'
import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { bookmarkTable } from '../../db/schema/bookmark'
import { bookmarkTagsTable } from '../../db/schema/bookmark-tag'
import { tagsTable } from '../../db/schema/tag'
import {
  bookmarkIdSchema,
  bookmarkNoteSchema,
  bookmarkTitleSchema,
  bookmarkUrlSchema
} from '../../features/bookmarks/domain/bookmark-values'
import { getBookmarkDetail } from '../../features/bookmarks/persistence/get-bookmark-detail'
import { insertBookmark } from '../../features/bookmarks/persistence/insert-bookmark'
import { selectBookmarkEditor } from '../../features/bookmarks/persistence/select-bookmark-editor'
import { softDeleteBookmark } from '../../features/bookmarks/persistence/soft-delete-bookmark'
import { updateBookmark } from '../../features/bookmarks/persistence/update-bookmark'
import { tagIdSchema, toTagName } from '../../features/tags/domain/tag-values'
import { selectShelfTags } from '../../features/tags/persistence/select-shelf-tags'
import { selectTagById } from '../../features/tags/persistence/select-tag-by-id'
import { selectTags } from '../../features/tags/persistence/select-tags'
import { touchTag } from '../../features/tags/persistence/touch-tag'
import { updateTag } from '../../features/tags/persistence/update-tag'
import { bookmarkId, seedBookmark, seedTag, seedUser, withPersistenceDb } from './migrated-db'

const actor = 'user-a'
const other = 'user-b'
const ownBookmarkId = bookmarkId(1)
const otherBookmarkId = bookmarkId(2)

describe('user ownership on migrated libSQL', () => {
  const persistence = withPersistenceDb()

  test('他ユーザーの bookmark は詳細・編集・更新・削除できない', async () => {
    const db = persistence.getDb()
    const actorId = await seedUser(db, actor)
    await seedUser(db, other)
    await seedBookmark(db, { id: otherBookmarkId, userId: other, title: '他人' })

    const detail = await getBookmarkDetail(db, actorId, { id: otherBookmarkId })
    const editor = await selectBookmarkEditor(db, actorId, otherBookmarkId)
    const updated = await updateBookmark(db, {
      userId: actorId,
      bookmarkId: v.parse(bookmarkIdSchema, otherBookmarkId),
      url: v.parse(bookmarkUrlSchema, 'https://example.com/hijack'),
      title: v.parse(bookmarkTitleSchema, 'hijack'),
      note: v.parse(bookmarkNoteSchema, null),
      tagIds: []
    })
    const deleted = await softDeleteBookmark(db, { userId: actorId, id: otherBookmarkId })
    const [row] = await db
      .select({ title: bookmarkTable.title, deletedAt: bookmarkTable.deletedAt })
      .from(bookmarkTable)
      .where(eq(bookmarkTable.id, otherBookmarkId))

    expect(detail).toBeNull()
    expect(editor).toBeNull()
    expect(updated).toEqual({ kind: 'bookmark-not-found' })
    expect(deleted).toEqual({ kind: 'bookmark-not-found' })
    expect(row).toEqual({ title: '他人', deletedAt: null })
  })

  test('他ユーザーの tag は取得・更新・touch できず、bookmark へ付けられない', async () => {
    const db = persistence.getDb()
    const actorId = await seedUser(db, actor)
    await seedUser(db, other)
    const foreignTagId = await seedTag(db, { userId: other, name: 'secret' })
    await seedBookmark(db, { id: ownBookmarkId, userId: actor, url: 'https://example.com/own' })

    const selected = await selectTagById(db, actorId, foreignTagId)
    const updated = await updateTag(db, {
      userId: actorId,
      id: v.parse(tagIdSchema, foreignTagId),
      name: toTagName('stolen'),
      pinned: false,
      sortOrder: 0,
      color: null
    })
    const touched = await touchTag(db, {
      userId: actorId,
      id: v.parse(tagIdSchema, foreignTagId)
    })
    const attached = await insertBookmark(db, {
      userId: actorId,
      url: v.parse(bookmarkUrlSchema, 'https://example.com/new'),
      title: v.parse(bookmarkTitleSchema, 'new'),
      note: v.parse(bookmarkNoteSchema, null),
      tagIds: [v.parse(tagIdSchema, foreignTagId)]
    })
    const replaced = await updateBookmark(db, {
      userId: actorId,
      bookmarkId: v.parse(bookmarkIdSchema, ownBookmarkId),
      url: v.parse(bookmarkUrlSchema, 'https://example.com/own'),
      title: v.parse(bookmarkTitleSchema, 'own'),
      note: v.parse(bookmarkNoteSchema, null),
      tagIds: [v.parse(tagIdSchema, foreignTagId)]
    })
    const [foreignTag] = await db
      .select({ name: tagsTable.name, lastUsedAt: tagsTable.lastUsedAt })
      .from(tagsTable)
      .where(eq(tagsTable.id, foreignTagId))
    const links = await db.select().from(bookmarkTagsTable)
    const bookmarks = await db.select({ url: bookmarkTable.url }).from(bookmarkTable)

    expect(selected).toBeNull()
    expect(updated).toEqual({ kind: 'not-found' })
    expect(touched).toEqual({ kind: 'not-found' })
    expect(attached).toEqual({ kind: 'invalid-tag' })
    expect(replaced).toEqual({ kind: 'invalid-tag' })
    expect(foreignTag).toEqual({ name: 'secret', lastUsedAt: null })
    expect(links).toEqual([])
    expect(bookmarks.map((row) => row.url)).toEqual(['https://example.com/own'])
  })

  test('棚の集計は他ユーザーの tag / bookmark を混ぜない', async () => {
    const db = persistence.getDb()
    const actorId = await seedUser(db, actor)
    await seedUser(db, other)
    const workId = await seedTag(db, { userId: actor, name: 'work' })
    const secretId = await seedTag(db, { userId: other, name: 'secret' })
    await seedBookmark(db, { id: ownBookmarkId, userId: actor, tagIds: [workId] })
    await seedBookmark(db, { id: otherBookmarkId, userId: other, tagIds: [secretId] })
    await seedBookmark(db, {
      id: bookmarkId(3),
      userId: other,
      tagIds: [workId]
    })

    const shelf = await selectShelfTags(db, actorId)

    expect(
      shelf.map((tag) => ({ id: tag.id, name: tag.name, bookmarkCount: tag.bookmarkCount }))
    ).toEqual([{ id: workId, name: 'work', bookmarkCount: 1 }])
  })

  test('selectTags は他ユーザーの tag を返さない', async () => {
    const db = persistence.getDb()
    const actorId = await seedUser(db, actor)
    await seedUser(db, other)
    const workId = await seedTag(db, { userId: actor, name: 'work' })
    await seedTag(db, { userId: other, name: 'secret' })

    const rows = await selectTags(db, actorId, { limit: 1000, offset: 0 })

    expect(rows).toEqual([{ id: workId, name: 'work' }])
  })
})
