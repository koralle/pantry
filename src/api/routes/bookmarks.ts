import { Hono } from 'hono'

import { getDb, generateId, nowUTC } from '../../db'
import { encodeCursor, decodeCursor, computeFilterHash } from '../lib/cursor'
import { AppError } from '../lib/error'
import { fetchTitle } from '../lib/fetch-title'
import { normalizeTags } from '../lib/tag-normalize'
import { normalizeUrl } from '../lib/url-normalize'
import { auth } from '../middleware/auth'

type Row = Record<string, string | number | null>

interface BookmarkRow {
  id: string
  url: string
  title: string
  note: string | null
  created_at: string
  updated_at: string
}

interface TagRow {
  bookmark_id: string
  name: string
}

const bookmarkRouter = new Hono<{ Bindings: Env }>()
bookmarkRouter.use('*', auth)

bookmarkRouter.get('/', async (c) => {
  const userId = c.get('userId')
  const db = getDb(c.env)

  const q = c.req.query('q')
  const rawTags = c.req.queries('tags')
  const tagMode = c.req.query('tagMode') ?? 'and'
  const sort = c.req.query('sort') ?? 'newest'
  const limit = Math.min(Math.max(Number.parseInt(c.req.query('limit') ?? '20', 10) || 20, 1), 100)
  const cursorRaw = c.req.query('cursor')

  if (tagMode !== 'and' && tagMode !== 'or') {
    throw new AppError(400, 'INVALID_INPUT', 'tagMode must be "and" or "or"')
  }
  if (sort !== 'newest' && sort !== 'updated') {
    throw new AppError(400, 'INVALID_INPUT', 'sort must be "newest" or "updated"')
  }

  let tagNames: string[] = []
  if (rawTags) {
    tagNames = normalizeTags(rawTags)
    for (const t of tagNames) {
      if (t.length === 0 || t.length > 32) {
        throw new AppError(400, 'INVALID_INPUT', 'Tag must be 1-32 characters')
      }
    }
  }

  const filterHash = computeFilterHash({ q: q ?? '', sort, tagMode, tags: rawTags?.join(',') })

  const conditions: string[] = ['b.user_id = ?', 'b.deleted_at IS NULL']
  const params: unknown[] = [userId]

  if (q) {
    conditions.push('(b.title LIKE ? OR b.url LIKE ? OR b.note LIKE ?)')
    const pattern = `%${q}%`
    params.push(pattern, pattern, pattern)
  }

  if (tagNames.length > 0) {
    const placeholders = tagNames.map(() => '?').join(',')
    if (tagMode === 'and') {
      conditions.push(
        `(SELECT COUNT(DISTINCT bt.tag_id) FROM bookmark_tags bt JOIN tags t ON t.id = bt.tag_id WHERE bt.bookmark_id = b.id AND t.name IN (${placeholders})) = ?`
      )
      params.push(...tagNames, tagNames.length)
    } else {
      conditions.push(
        `EXISTS (SELECT 1 FROM bookmark_tags bt JOIN tags t ON t.id = bt.tag_id WHERE bt.bookmark_id = b.id AND t.name IN (${placeholders}))`
      )
      params.push(...tagNames)
    }
  }

  if (cursorRaw) {
    const cursor = decodeCursor(cursorRaw, sort, filterHash)
    if (sort === 'newest') {
      conditions.push('(b.created_at < ? OR (b.created_at = ? AND b.id < ?))')
      params.push(cursor.lastKey, cursor.lastKey, cursor.lastId)
    } else {
      conditions.push('(b.updated_at < ? OR (b.updated_at = ? AND b.id < ?))')
      params.push(cursor.lastKey, cursor.lastKey, cursor.lastId)
    }
  }

  const orderBy =
    sort === 'newest' ? 'b.created_at DESC, b.id DESC' : 'b.updated_at DESC, b.id DESC'
  params.push(limit + 1)

  const result = await db
    .prepare(
      `SELECT b.id, b.url, b.title, b.note, b.created_at, b.updated_at
       FROM bookmarks b WHERE ${conditions.join(' AND ')}
       ORDER BY ${orderBy} LIMIT ?`
    )
    .bind(...params)
    .all()

  const rows = result.results as unknown as BookmarkRow[]
  const hasMore = rows.length > limit
  const items = rows.slice(0, limit)

  const tagMap = new Map<string, string[]>()
  if (items.length > 0) {
    const ids = items.map((r) => r.id)
    const tagRows = await db
      .prepare(
        `SELECT bt.bookmark_id, t.name
         FROM bookmark_tags bt JOIN tags t ON t.id = bt.tag_id
         WHERE bt.bookmark_id IN (${ids.map(() => '?').join(',')})
         ORDER BY t.name`
      )
      .bind(...ids)
      .all()

    for (const tr of tagRows.results as unknown as TagRow[]) {
      const bid = tr.bookmark_id
      const arr = tagMap.get(bid) ?? []
      arr.push(tr.name)
      tagMap.set(bid, arr)
    }
  }

  const mapped = items.map((r) => ({
    createdAt: r.created_at,
    id: r.id,
    note: r.note,
    tags: tagMap.get(r.id) ?? [],
    title: r.title,
    updatedAt: r.updated_at,
    url: r.url
  }))

  let nextCursor: string | null = null
  if (hasMore) {
    const last = items.at(-1)!
    const key = sort === 'newest' ? last.created_at : last.updated_at
    nextCursor = encodeCursor({
      filterHash,
      lastId: last.id,
      lastKey: key,
      sort,
      v: 1
    })
  }

  return c.json({ items: mapped, nextCursor })
})

bookmarkRouter.post('/', async (c) => {
  const userId = c.get('userId')
  const db = getDb(c.env)
  const body = await c.req.json<{ url: string; title?: string; note?: string; tags?: string[] }>()

  const url = normalizeUrl(body.url)
  const tags = normalizeTags(body.tags)

  const existing = await db
    .prepare('SELECT id FROM bookmarks WHERE user_id = ? AND url = ? AND deleted_at IS NULL')
    .bind(userId, url)
    .first()

  if (existing) {
    throw new AppError(409, 'URL_CONFLICT', 'Bookmark with this URL already exists')
  }

  let title = body.title ?? null
  if (!title) {
    title = await fetchTitle(url)
  }

  if (!title) {
    throw new AppError(400, 'INVALID_INPUT', 'Title is required')
  }
  title = title.slice(0, 512)

  const id = generateId()
  const now = nowUTC()

  await db
    .prepare(
      'INSERT INTO bookmarks (id, user_id, url, title, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(id, userId, url, title, body.note ?? null, now, now)
    .run()

  for (const tagName of tags) {
    const tag = await db
      .prepare('INSERT OR IGNORE INTO tags (id, user_id, name, created_at) VALUES (?, ?, ?, ?)')
      .bind(generateId(), userId, tagName, now)
      .run()

    let tagId: string | undefined
    if ((tag.meta.changes ?? 0) > 0) {
      tagId = tag.meta.last_row_id?.toString()
    } else {
      const existingTag = (await db
        .prepare('SELECT id FROM tags WHERE user_id = ? AND name = ?')
        .bind(userId, tagName)
        .first()) as Row | undefined
      tagId = existingTag?.['id'] as string | undefined
    }

    if (tagId) {
      await db
        .prepare('INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)')
        .bind(id, tagId)
        .run()
    }
  }

  return c.json(
    {
      bookmark: {
        createdAt: now,
        id,
        note: body.note ?? null,
        tags,
        title,
        updatedAt: now,
        url
      }
    },
    201
  )
})

bookmarkRouter.get('/:bookmarkId', async (c) => {
  const userId = c.get('userId')
  const db = getDb(c.env)
  const bookmarkId = c.req.param('bookmarkId')

  const row = (await db
    .prepare(
      'SELECT id, url, title, note, created_at, updated_at FROM bookmarks WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
    )
    .bind(bookmarkId, userId)
    .first()) as unknown as BookmarkRow | undefined

  if (!row) {
    throw new AppError(404, 'NOT_FOUND', 'Bookmark not found')
  }

  const tagRows = await db
    .prepare(
      'SELECT t.name FROM bookmark_tags bt JOIN tags t ON t.id = bt.tag_id WHERE bt.bookmark_id = ? ORDER BY t.name'
    )
    .bind(bookmarkId)
    .all()

  const tags = (tagRows.results as unknown as { name: string }[]).map((r) => r.name)

  return c.json({
    bookmark: {
      createdAt: row.created_at,
      id: row.id,
      note: row.note,
      tags,
      title: row.title,
      updatedAt: row.updated_at,
      url: row.url
    }
  })
})

bookmarkRouter.patch('/:bookmarkId', async (c) => {
  const userId = c.get('userId')
  const db = getDb(c.env)
  const bookmarkId = c.req.param('bookmarkId')
  const body = await c.req.json<{
    url?: string
    title?: string
    note?: string | null
    tags?: string[]
  }>()

  const existing = (await db
    .prepare('SELECT id, url FROM bookmarks WHERE id = ? AND user_id = ? AND deleted_at IS NULL')
    .bind(bookmarkId, userId)
    .first()) as BookmarkRow | undefined

  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Bookmark not found')
  }

  const updates: string[] = []
  const params: unknown[] = []
  let shouldUpdateTimestamp = false

  if (body.url !== undefined) {
    const url = normalizeUrl(body.url)
    const dup = await db
      .prepare(
        'SELECT id FROM bookmarks WHERE user_id = ? AND url = ? AND id != ? AND deleted_at IS NULL'
      )
      .bind(userId, url, bookmarkId)
      .first()
    if (dup) {
      throw new AppError(409, 'URL_CONFLICT', 'Another bookmark with this URL already exists')
    }
    updates.push('url = ?')
    params.push(url)
    shouldUpdateTimestamp = true
  }

  if (body.title !== undefined) {
    updates.push('title = ?')
    params.push(body.title.slice(0, 512))
    shouldUpdateTimestamp = true
  }

  if (body.note !== undefined) {
    updates.push('note = ?')
    params.push(body.note)
    shouldUpdateTimestamp = true
  }

  if (body.tags !== undefined) {
    const tags = normalizeTags(body.tags)
    const now = nowUTC()

    await db.prepare('DELETE FROM bookmark_tags WHERE bookmark_id = ?').bind(bookmarkId).run()

    for (const tagName of tags) {
      const tag = await db
        .prepare('INSERT OR IGNORE INTO tags (id, user_id, name, created_at) VALUES (?, ?, ?, ?)')
        .bind(generateId(), userId, tagName, now)
        .run()

      let tagId: string | undefined
      if ((tag.meta.changes ?? 0) > 0) {
        tagId = tag.meta.last_row_id?.toString()
      } else {
        const existingTag = (await db
          .prepare('SELECT id FROM tags WHERE user_id = ? AND name = ?')
          .bind(userId, tagName)
          .first()) as Row | undefined
        tagId = existingTag?.['id'] as string | undefined
      }

      if (tagId) {
        await db
          .prepare('INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)')
          .bind(bookmarkId, tagId)
          .run()
      }
    }

    shouldUpdateTimestamp = true
  }

  if (updates.length > 0) {
    const now = nowUTC()
    if (shouldUpdateTimestamp) {
      updates.push('updated_at = ?')
      params.push(now)
    }
    params.push(bookmarkId)
    await db
      .prepare(`UPDATE bookmarks SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...params)
      .run()
  }

  const row = (await db
    .prepare('SELECT id, url, title, note, created_at, updated_at FROM bookmarks WHERE id = ?')
    .bind(bookmarkId)
    .first()) as BookmarkRow | undefined

  const tagRows = await db
    .prepare(
      'SELECT t.name FROM bookmark_tags bt JOIN tags t ON t.id = bt.tag_id WHERE bt.bookmark_id = ? ORDER BY t.name'
    )
    .bind(bookmarkId)
    .all()

  return c.json({
    bookmark: {
      createdAt: row!.created_at,
      id: row!.id,
      note: row!.note,
      tags: (tagRows.results as { name: string }[]).map((r) => r.name),
      title: row!.title,
      updatedAt: row!.updated_at,
      url: row!.url
    }
  })
})

bookmarkRouter.delete('/:bookmarkId', async (c) => {
  const userId = c.get('userId')
  const db = getDb(c.env)
  const bookmarkId = c.req.param('bookmarkId')

  const existing = await db
    .prepare('SELECT id FROM bookmarks WHERE id = ? AND user_id = ? AND deleted_at IS NULL')
    .bind(bookmarkId, userId)
    .first()

  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Bookmark not found')
  }

  await db
    .prepare('UPDATE bookmarks SET deleted_at = ? WHERE id = ?')
    .bind(nowUTC(), bookmarkId)
    .run()

  return c.body(null, 204)
})

export { bookmarkRouter }
