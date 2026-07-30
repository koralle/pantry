import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PackageOpen } from 'lucide-react'
import * as v from 'valibot'

import { EditWorkbench } from '../../../../features/bookmarks/components/edit-bookmark-workbench'
import { loadBookmarkEditor } from '../../../../features/bookmarks/loaders/load-bookmark-editor'
import { buildListBackSearch } from '../../../../features/navigation/lib/bookmark-search-builders'
import { StyledLink } from '../../../../shared/components/styled-link'
import { workbench } from '../../../../styles/workbench'

const bookmarkEditSearchSchema = v.object({
  tags: v.optional(v.array(v.string()))
})

export const Route = createFileRoute('/_protected/bookmarks/$id/edit')({
  validateSearch: bookmarkEditSearchSchema,
  loader: async ({ params }) => loadBookmarkEditor(params.id),
  component: RouteComponent
})

function RouteComponent() {
  const data = Route.useLoaderData()
  const search = Route.useSearch()

  const navigate = useNavigate()
  const listSearch = buildListBackSearch(search?.tags)

  if (data.kind === 'not-found') {
    return (
      <section
        className={workbench}
        aria-label='ブックマーク編集'>
        <PackageOpen
          size={20}
          aria-hidden
        />

        <h1>このブックマークは見つかりません</h1>

        <StyledLink
          to='/'
          search={listSearch}
          visual='accent'>
          一覧へ戻る
        </StyledLink>
      </section>
    )
  }

  return (
    <EditWorkbench
      bookmark={data.bookmark}
      tags={data.tags}
      listSearch={listSearch}
      searchTags={search?.tags}
      navigate={navigate}
    />
  )
}
