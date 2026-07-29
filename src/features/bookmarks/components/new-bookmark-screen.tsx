import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'

import { StyledLink } from '../../../shared/components/styled-link'
import { workbench, workbenchLead, workbenchNav, workbenchTitle } from '../../../styles/workbench'
import { buildListBackSearch } from '../../navigation/lib/bookmark-search-builders'
import { fetchTags } from '../../tags/functions/fetch-tags'
import { addBookmark } from '../functions/add-bookmark'
import { BookmarkWorkbenchForm } from './bookmark-workbench-form'

export function NewBookmarkScreen({
  tags,
  searchTags
}: {
  readonly tags: Awaited<ReturnType<typeof fetchTags>>
  readonly searchTags: string[] | undefined
}) {
  const navigate = useNavigate()
  const listSearch = buildListBackSearch(searchTags)
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(() => {
    if (searchTags === undefined || searchTags.length === 0) {
      return []
    }
    return tags.filter((tag) => searchTags?.includes(tag.name)).map((tag) => tag.id)
  })

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

      <h1 className={workbenchTitle}>ブックマークをしまう</h1>
      <p className={workbenchLead}>URLを入れて、必要ならタイトルを取得してから保存します。</p>

      <BookmarkWorkbenchForm
        mode='new'
        initialValues={{ url: '', title: '', note: null }}
        allTags={tags}
        selectedTagIds={selectedTagIds}
        onTagChange={setSelectedTagIds}
        submitLabel='登録'
        pendingLabel='登録中…'
        onSubmit={async ({ url, title, note }) => {
          const { id } = await addBookmark({
            data: { url, title, note, tags: selectedTagIds }
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
