import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { createFileRoute, Outlet, redirect, useSearch } from '@tanstack/react-router'
import { useRef } from 'react'

import { AppHeader } from '../features/app-shell/components/app-header'
import { MobileShelfDialog } from '../features/app-shell/components/mobile-shelf-dialog'
import { ProtectedShell } from '../features/app-shell/components/protected-shell'
import { ShelfSidebar } from '../features/app-shell/components/shelf-sidebar'
import { resolveChromeListSearch } from '../features/navigation/lib/bookmark-search-builders'
import { getRpcClient } from '../rpc/runtime-client'

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ location }) => {
    const client = await getRpcClient()
    const session = await client.auth.session()

    if (session === null) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href }
      })
    }

    return session
  },
  loader: async ({ context }) => {
    const client = await getRpcClient()
    const orpc = createTanstackQueryUtils(client)
    const shelfTagsPromise = context.queryClient.ensureQueryData(
      orpc.tags.shelf.queryOptions({ staleTime: 5000 })
    )

    return { shelfTagsPromise }
  },
  component: () => <Layout />
})

function Layout() {
  const { shelfTagsPromise } = Route.useLoaderData()
  const indexSearch = useSearch({ from: '/_protected/', shouldThrow: false })
  const detailSearch = useSearch({ from: '/_protected/bookmarks/$id/', shouldThrow: false })
  const newSearch = useSearch({ from: '/_protected/bookmarks/new/', shouldThrow: false })
  const editSearch = useSearch({ from: '/_protected/bookmarks/$id/edit', shouldThrow: false })
  const rememberedListSearch = useRef(indexSearch)

  if (indexSearch !== undefined) {
    rememberedListSearch.current = indexSearch
  }

  const listSearch = resolveChromeListSearch(indexSearch, rememberedListSearch.current, [
    detailSearch,
    newSearch,
    editSearch
  ])

  const selection = {
    listActive: indexSearch !== undefined,
    tags: indexSearch?.tags
  }

  const newBookmarkSearch =
    listSearch?.tags !== undefined && listSearch.tags.length > 0 ? { tags: listSearch.tags } : {}

  return (
    <ProtectedShell
      sidebar={
        <ShelfSidebar
          shelfTagsPromise={shelfTagsPromise}
          selection={selection}
          listSearch={listSearch}
        />
      }
      header={
        <AppHeader
          newBookmarkSearch={newBookmarkSearch}
          listSearch={listSearch}
          shelfTrigger={
            <MobileShelfDialog
              shelfTagsPromise={shelfTagsPromise}
              selection={selection}
              listSearch={listSearch}
            />
          }
        />
      }>
      <Outlet />
    </ProtectedShell>
  )
}
