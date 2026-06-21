import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/bookmarks/')({
  beforeLoad: () => {
    throw redirect({
      to: '/',
      statusCode: 301
    })
  }
})
