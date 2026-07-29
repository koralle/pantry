import { createFileRoute, Outlet, redirect, useSearch } from '@tanstack/react-router'

import { AppHeader } from '../features/app-shell/components/app-header'
import { MobileShelfDialog } from '../features/app-shell/components/mobile-shelf-dialog'
import { ProtectedShell } from '../features/app-shell/components/protected-shell'
import { ShelfSidebar } from '../features/app-shell/components/shelf-sidebar'
import { getSession } from '../features/auth/functions/get-session'
import { fetchShelfTags } from '../features/tags/functions/fetch-shelf-tags'

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ location }) => {
    const session = await getSession()

    if (!session) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href }
      })
    }

    return { user: session.user }
  },
  loader: async () => {
    const shelfTagsPromise = fetchShelfTags()
    return { shelfTagsPromise }
  },
  component: () => <Layout />
})

function Layout() {
  const { shelfTagsPromise } = Route.useLoaderData()
  const indexSearch = useSearch({ from: '/_protected/', shouldThrow: false })

  const selection = {
    view: indexSearch?.view,
    tags: indexSearch?.tags
  }

  const newBookmarkSearch =
    indexSearch?.tags !== undefined && indexSearch.tags.length > 0 ? { tags: indexSearch.tags } : {}

  return (
    <ProtectedShell
      sidebar={
        <ShelfSidebar
          shelfTagsPromise={shelfTagsPromise}
          selection={selection}
        />
      }
      header={
        <AppHeader
          newBookmarkSearch={newBookmarkSearch}
          shelfTrigger={
            <MobileShelfDialog
              shelfTagsPromise={shelfTagsPromise}
              selection={selection}
            />
          }
        />
      }>
      <Outlet />
    </ProtectedShell>
  )
}
