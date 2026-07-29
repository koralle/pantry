import { createServerFn } from '@tanstack/react-start'
import * as v from 'valibot'

import { fetchPageTitle } from './fetch-page-title.server'

export const fetchBookmarkTitle = createServerFn({ method: 'POST' })
  .validator(v.object({ url: v.pipe(v.string(), v.url()) }))
  .handler(async (ctx) => fetchPageTitle(ctx.data.url))
