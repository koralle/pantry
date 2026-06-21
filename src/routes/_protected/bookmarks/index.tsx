import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/bookmarks/')({
  beforeLoad: () => {
    throw redirect({
      to: '/',
      search: { tagMode: 'and', sort: 'newest' },
      statusCode: 301
    })
  }
})
