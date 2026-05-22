import handler from '@tanstack/react-start/server-entry'
import { Hono } from 'hono'
import { api } from './api'

const app = new Hono<{ Bindings: Env }>()

app.route('/api', api)

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/api')) {
      return app.fetch(request, env, ctx)
    }
    return handler.fetch(request)
  },
}
