import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'

import { StyledLink } from '../../../shared/components/styled-link'
import { workbench, workbenchLead, workbenchNav, workbenchTitle } from '../../../styles/workbench'
import { buildListBackSearch } from '../../navigation/lib/bookmark-search-builders'
import type { fetchTags } from '../../tags/functions/fetch-tags'
import type { getBookmark } from '../functions/get-bookmark'
import { updateBookmark } from '../functions/update-bookmark'
import { BookmarkWorkbenchForm } from './bookmark-workbench-form'

type BookmarkRecord = Awaited<ReturnType<typeof getBookmark>>
type TagRecord = Awaited<ReturnType<typeof fetchTags>>[number]

export function EditWorkbench({
  bookmark,
  tags,
  listSearch,
  searchTags,
  navigate
}: {
  readonly bookmark: BookmarkRecord
  readonly tags: TagRecord[]
  readonly listSearch: ReturnType<typeof buildListBackSearch>
  readonly searchTags: string[] | undefined
  readonly navigate: ReturnType<typeof useNavigate>
}) {
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(bookmark.tagIds)

  return (
    <section
      className={workbench}
      aria-label='ブックマーク編集'>
      <nav className={workbenchNav}>
        <StyledLink
          to='/bookmarks/$id'
          params={{ id: bookmark.id }}
          search={searchTags !== undefined ? { tags: searchTags } : {}}
          visual='accent'>
          <ArrowLeft
            size={16}
            aria-hidden
          />{' '}
          詳細へ戻る
        </StyledLink>
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

      <h1 className={workbenchTitle}>ブックマークを並べ替える</h1>
      <p className={workbenchLead}>内容を直し、主ボタンで保存します。</p>

      <BookmarkWorkbenchForm
        mode='edit'
        initialValues={{
          url: bookmark.url,
          title: bookmark.title,
          note: bookmark.note
        }}
        allTags={tags}
        selectedTagIds={selectedTagIds}
        onTagChange={setSelectedTagIds}
        submitLabel='更新'
        pendingLabel='更新中…'
        onSubmit={async ({ url, title, note }) => {
          await updateBookmark({
            data: { id: bookmark.id, url, title, note, tags: selectedTagIds }
          })
          await navigate({
            to: '/bookmarks/$id',
            params: { id: bookmark.id },
            search: searchTags !== undefined ? { tags: searchTags } : {},
            state: { bookmarkUpdated: true }
          })
        }}
      />
    </section>
  )
}
