import handler from '@tanstack/react-start/server-entry'
import { Hono } from 'hono'

import { api } from './api'

const app = new Hono<{ Bindings: Env }>()

app.route('/api', api)

const worker = {
  async fetch(
    request: Readonly<Request>,
    env: Readonly<Env>,
    ctx: Readonly<ExecutionContext>
  ): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/api')) {
      const response = await app.fetch(request, env, ctx)
      return response
    }
    return handler.fetch(request)
  }
}

export default worker
