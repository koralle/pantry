import { createServerFn } from '@tanstack/react-start'
import * as v from 'valibot'

import { fetchPageTitle } from '../server/fetch-page-title.server'

export const fetchBookmarkTitle = createServerFn({ method: 'POST' })
  .validator(v.object({ url: v.pipe(v.string(), v.url()) }))
  .handler(async (ctx) => {
    const output = await fetchPageTitle(ctx.data.url)
    return output.kind === 'fetched' ? output.title : null
  })
