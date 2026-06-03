import { Hono } from 'hono'

import { errorHandler } from './middleware/error-handler'
import { bookmarkRouter } from './routes/bookmarks'
import { tagRouter } from './routes/tags'

const api = new Hono<{ Bindings: Env }>()

api.onError(errorHandler)

api.get('/health', (c) => c.json({ status: 'ok' }))

const v1 = new Hono<{ Bindings: Env }>()
v1.route('/bookmarks', bookmarkRouter)
v1.route('/tags', tagRouter)

api.route('/v1', v1)

export { api }
