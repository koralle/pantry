import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import * as v from 'valibot'

import { BookmarkWorkbenchForm } from '../-components/bookmark-workbench-form'
import { buildListBackSearch } from '../-lib/list-back-search'
import { UiEmpty } from '../../../../components/ui-state'
import { getBookmark, updateBookmark } from '../../../../features/bookmarks/bookmark.function'
import { fetchTags } from '../../../../features/tags/tag.function'

const bookmarkEditSearchSchema = v.object({
  tags: v.optional(v.array(v.string()))
})

type BookmarkRecord = Awaited<ReturnType<typeof getBookmark>>
type TagRecord = Awaited<ReturnType<typeof fetchTags>>[number]

export const Route = createFileRoute('/_protected/bookmarks/$id/edit')({
  validateSearch: bookmarkEditSearchSchema,
  loader: async ({ params }) => {
    try {
      const bookmark = await getBookmark({ data: { id: params.id } })
      const tags = await fetchTags({ data: { limit: 1000, offset: 0 } })
      return { kind: 'ok' as const, bookmark, tags }
    } catch (error) {
      if (error instanceof Error && error.message === 'Bookmark not found') {
        return { kind: 'not-found' as const }
      }
      throw error
    }
  },
  component: RouteComponent
})

function RouteComponent() {
  const data = Route.useLoaderData()
  const navigate = useNavigate()
  const search = Route.useSearch()
  const listSearch = buildListBackSearch(search.tags)

  if (data.kind === 'not-found') {
    return (
      <section
        className='pantry-workbench'
        aria-label='ブックマーク編集'>
        <UiEmpty
          title='このブックマークは見つかりません'
          action={
            <Link
              to='/'
              search={listSearch}
              className='pantry-text-link'>
              一覧へ戻る
            </Link>
          }
        />
      </section>
    )
  }

  return (
    <EditWorkbench
      bookmark={data.bookmark}
      tags={data.tags}
      listSearch={listSearch}
      searchTags={search.tags}
      navigate={navigate}
    />
  )
}

function EditWorkbench({
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
      className='pantry-workbench'
      aria-label='ブックマーク編集'>
      <nav className='pantry-workbench__nav'>
        <Link
          to='/bookmarks/$id'
          params={{ id: bookmark.id }}
          search={searchTags !== undefined ? { tags: searchTags } : {}}
          className='pantry-text-link'>
          詳細へ戻る
        </Link>
        <Link
          to='/'
          search={listSearch}
          className='pantry-text-link'>
          一覧へ戻る
        </Link>
      </nav>

      <h1 className='pantry-workbench__title'>ブックマークを並べ替える</h1>
      <p className='pantry-workbench__lead'>内容を直し、主ボタンで保存します。</p>

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
