import { useMutation } from '@tanstack/react-query'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { orpc } from '../../../rpc/query'
import { StyledLink } from '../../../shared/components/styled-link'
import { workbench, workbenchLead, workbenchNav, workbenchTitle } from '../../../styles/workbench'
import { buildListBackSearch } from '../../navigation/lib/bookmark-search-builders'
import { getCreateBookmarkErrorMessage } from '../lib/get-create-bookmark-error-message'
import { refreshAfterCreateBookmark } from '../lib/refresh-after-create-bookmark'
import { BookmarkWorkbenchForm } from './bookmark-workbench-form'
import { buildNewBookmarkCommand } from './new-bookmark-command'

/**
 * CreateBookmark の画面経路。Server Function の Error.name 判定を捨て、
 * typed error code と best-effort な loader 再取得だけに揃える。
 */
export function NewBookmarkScreen({ searchTags }: { readonly searchTags: string[] | undefined }) {
  const navigate = useNavigate()
  const router = useRouter()
  const listSearch = buildListBackSearch(searchTags)
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
            search: searchTags !== undefined ? { tags: searchTags } : {},
            state: { newBookmarkCreated: true }
          })
        }}
      />
    </section>
  )
}
