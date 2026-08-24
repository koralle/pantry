import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import * as v from 'valibot'

import { BookmarkWorkbenchForm } from '../../../../features/bookmarks/components/bookmark-workbench-form'
import { buildNewBookmarkCommand } from '../../../../features/bookmarks/components/new-bookmark-command'
import { getCreateBookmarkErrorMessage } from '../../../../features/bookmarks/lib/get-create-bookmark-error-message'
import { refreshAfterCreateBookmark } from '../../../../features/bookmarks/lib/refresh-after-create-bookmark'
import { buildListBackSearch } from '../../../../features/navigation/lib/bookmark-search-builders'
import { orpc } from '../../../../rpc/query'
import { StyledLink } from '../../../../shared/components/styled-link'
import {
  workbench,
  workbenchLead,
  workbenchNav,
  workbenchTitle
} from '../../../../styles/workbench'

const bookmarkNewSearchSchema = v.object({
  tags: v.optional(v.array(v.string()))
})

export const Route = createFileRoute('/_protected/bookmarks/new/')({
  validateSearch: bookmarkNewSearchSchema,
  component: RouteComponent
})

function RouteComponent() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const router = useRouter()
  const listSearch = buildListBackSearch(search.tags)
  const mutation = useMutation(
    orpc.bookmarks.create.mutationOptions({
      onSuccess: () => {
        refreshAfterCreateBookmark(router)
      }
    })
  )

  return (
    <section
      className={workbench}
      aria-label='ブックマーク新規作成'>
      <nav className={workbenchNav}>
        <StyledLink
          to='/'
          search={listSearch}
          visual='accent'>
          <ArrowLeft
            size={16}
            aria-hidden
          />{' '}
          一覧へ戻る
        </StyledLink>
      </nav>

      <h1 className={workbenchTitle}>ブックマークを追加</h1>
      <p className={workbenchLead}>URLを入れて、必要ならタイトルを取得してから保存します。</p>

      <BookmarkWorkbenchForm
        mode='new'
        initialValues={{ url: '', title: '', note: null }}
        submitLabel='登録'
        pendingLabel='登録中…'
        mapError={getCreateBookmarkErrorMessage}
        onSubmit={async ({ url, title, note }) => {
          const { id } = await mutation.mutateAsync(buildNewBookmarkCommand({ url, title, note }))
          await navigate({
            to: '/bookmarks/$id',
            params: { id },
            search: search.tags !== undefined ? { tags: search.tags } : {},
            state: { newBookmarkCreated: true }
          })
        }}
      />
    </section>
  )
}
