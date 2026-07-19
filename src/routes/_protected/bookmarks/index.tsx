import { createFileRoute, redirect } from '@tanstack/react-router'

import { defaultBookmarkSearch } from '../-lib/bookmark-search-schema'

export const Route = createFileRoute('/_protected/bookmarks/')({
  beforeLoad: () => {
    throw redirect({
      to: '/',
      search: defaultBookmarkSearch,
      statusCode: 301
    })
  }
})
