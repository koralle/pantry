import { Hono } from 'hono'

import { getDb } from '../../db'
import { AppError } from '../lib/error'
import { auth } from '../middleware/auth'

interface TagRow {
  id: string
  name: string
  created_at: string
  count: number
}

const tagRouter = new Hono<{ Bindings: Env }>()
tagRouter.use('*', auth)

tagRouter.get('/', async (c) => {
  const userId = c.get('userId')
  const db = getDb(c.env)

  const result = await db
    .prepare(
      `SELECT t.id, t.name, t.created_at, COUNT(bt.bookmark_id) AS count
       FROM tags t
       LEFT JOIN bookmark_tags bt ON bt.tag_id = t.id
       WHERE t.user_id = ?
       GROUP BY t.id
       ORDER BY count DESC, t.name ASC
       LIMIT 200`
    )
    .bind(userId)
    .all()

  const items = (result.results as unknown as TagRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    count: r.count,
    createdAt: r.created_at
  }))

  return c.json({ items })
})

tagRouter.get('/suggest', async (c) => {
  const userId = c.get('userId')
  const db = getDb(c.env)

  const rawQ = c.req.query('q')
  if (!rawQ || rawQ.trim().length === 0) {
    throw new AppError(400, 'INVALID_INPUT', 'q parameter is required')
  }

  const q = rawQ.trim()
  const limit = Math.min(Math.max(Number.parseInt(c.req.query('limit') ?? '10', 10) || 10, 1), 20)

  const result = await db
    .prepare(
      `SELECT t.name, COUNT(bt.bookmark_id) AS count
       FROM tags t
       LEFT JOIN bookmark_tags bt ON bt.tag_id = t.id
       WHERE t.user_id = ? AND t.name LIKE ?
       GROUP BY t.name
       ORDER BY
         CASE WHEN t.name = ? THEN 0
              WHEN t.name LIKE ? THEN 1
              ELSE 2 END,
         count DESC,
         t.name ASC
       LIMIT ?`
    )
    .bind(userId, `${q}%`, q, `${q}%`, limit)
    .all()

  const items = (result.results as unknown as { name: string; count: number }[]).map((r) => ({
    name: r.name,
    count: r.count
  }))

  return c.json({ items })
})

tagRouter.patch('/:tagId', async (c) => {
  const userId = c.get('userId')
  const db = getDb(c.env)
  const tagId = c.req.param('tagId')
  const body = await c.req.json<{ name: string }>()

  const trimmed = body.name.trim()
  if (trimmed.length === 0 || trimmed.length > 32) {
    throw new AppError(400, 'INVALID_INPUT', 'Tag name must be 1-32 characters')
  }

  const normalized = trimmed.toLowerCase()

  const existing = (await db
    .prepare('SELECT id, name FROM tags WHERE id = ? AND user_id = ?')
    .bind(tagId, userId)
    .first()) as { id: string; name: string } | undefined

  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Tag not found')
  }

  if (normalized === existing.name) {
    const row = (await db
      .prepare(
        `SELECT t.id, t.name, t.created_at, COUNT(bt.bookmark_id) AS count
         FROM tags t
         LEFT JOIN bookmark_tags bt ON bt.tag_id = t.id
         WHERE t.id = ?
         GROUP BY t.id`
      )
      .bind(tagId)
      .first()) as unknown as TagRow | undefined

    return c.json({
      tag: {
        id: row!.id,
        name: row!.name,
        count: row!.count,
        createdAt: row!.created_at
      }
    })
  }

  const conflict = await db
    .prepare('SELECT id FROM tags WHERE user_id = ? AND name = ? AND id != ?')
    .bind(userId, normalized, tagId)
    .first()

  if (conflict) {
    throw new AppError(409, 'TAG_CONFLICT', 'A tag with this name already exists')
  }

  await db.prepare('UPDATE tags SET name = ? WHERE id = ?').bind(normalized, tagId).run()

  const row = (await db
    .prepare(
      `SELECT t.id, t.name, t.created_at, COUNT(bt.bookmark_id) AS count
       FROM tags t
       LEFT JOIN bookmark_tags bt ON bt.tag_id = t.id
       WHERE t.id = ?
       GROUP BY t.id`
    )
    .bind(tagId)
    .first()) as unknown as TagRow | undefined

  return c.json({
    tag: {
      id: row!.id,
      name: row!.name,
      count: row!.count,
      createdAt: row!.created_at
    }
  })
})

tagRouter.delete('/:tagId', async (c) => {
  const userId = c.get('userId')
  const db = getDb(c.env)
  const tagId = c.req.param('tagId')

  const existing = await db
    .prepare('SELECT id FROM tags WHERE id = ? AND user_id = ?')
    .bind(tagId, userId)
    .first()

  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Tag not found')
  }

  await db.prepare('DELETE FROM bookmark_tags WHERE tag_id = ?').bind(tagId).run()
  await db.prepare('DELETE FROM tags WHERE id = ?').bind(tagId).run()

  return c.body(null, 204)
})

export { tagRouter }
