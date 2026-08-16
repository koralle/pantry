import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { StyledLink } from '../../../shared/components/styled-link'
import { workbench, workbenchLead, workbenchNav, workbenchTitle } from '../../../styles/workbench'
import { buildListBackSearch } from '../../navigation/lib/bookmark-search-builders'
import { addBookmark } from '../functions/add-bookmark'
import { BookmarkWorkbenchForm } from './bookmark-workbench-form'
import { buildNewBookmarkCommand } from './new-bookmark-command'

export function NewBookmarkScreen({ searchTags }: { readonly searchTags: string[] | undefined }) {
  const navigate = useNavigate()
  const listSearch = buildListBackSearch(searchTags)

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
        onSubmit={async ({ url, title, note }) => {
          const { id } = await addBookmark({
            data: buildNewBookmarkCommand({ url, title, note })
          })
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
