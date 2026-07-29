import { createFileRoute, redirect } from '@tanstack/react-router'

import { defaultBookmarkSearch } from '../../../features/navigation/lib/bookmark-search'

export const Route = createFileRoute('/_protected/bookmarks/')({
  beforeLoad: () => {
    throw redirect({
      to: '/',
      search: defaultBookmarkSearch,
      statusCode: 301
    })
  }
})
