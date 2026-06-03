import { Hono } from 'hono'

export const api = new Hono<{ Bindings: Env }>()

api.get('/health', (context) => context.json({ status: 'ok' }))
