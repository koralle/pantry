import { createFileRoute, redirect } from '@tanstack/react-router'
import * as v from 'valibot'

import { bookmarkSearchSchema } from '../../../features/navigation/lib/bookmark-search'

export const Route = createFileRoute('/_protected/bookmarks/')({
  validateSearch: (search) => v.parse(bookmarkSearchSchema, search),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: '/',
      search,
      statusCode: 301
    })
  }
})
