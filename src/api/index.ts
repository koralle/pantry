import { Hono } from 'hono'

export const api = new Hono<{ Bindings: Env }>()

api.get('/health', (c) => {
  return c.json({ status: 'ok' })
})
