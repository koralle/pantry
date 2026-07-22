import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import * as v from 'valibot'

import { BookmarkWorkbenchForm } from '../-components/bookmark-workbench-form'
import { buildListBackSearch } from '../-lib/list-back-search'
import { addBookmark } from '../../../../features/bookmarks/bookmark.function'
import { fetchTags } from '../../../../features/tags/tag.function'

const bookmarkNewSearchSchema = v.object({
  tags: v.optional(v.array(v.string()))
})

export const Route = createFileRoute('/_protected/bookmarks/new/')({
  validateSearch: bookmarkNewSearchSchema,
  loader: async () => {
    const tags = await fetchTags({ data: { limit: 1000, offset: 0 } })
    return { tags }
  },
  component: RouteComponent
})

function RouteComponent() {
  const navigate = useNavigate()
  const { tags } = Route.useLoaderData()
  const search = Route.useSearch()
  const listSearch = buildListBackSearch(search.tags)
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(() => {
    if (search.tags === undefined || search.tags.length === 0) {
      return []
    }
    return tags.filter((tag) => search.tags?.includes(tag.name)).map((tag) => tag.id)
  })

  return (
    <section
      className='pantry-workbench'
      aria-label='ブックマーク新規作成'>
      <nav className='pantry-workbench__nav'>
        <Link
          to='/'
          search={listSearch}
          className='pantry-text-link'>
          <ArrowLeft
            size={16}
            aria-hidden
          />{' '}
          一覧へ戻る
        </Link>
      </nav>

      <h1 className='pantry-workbench__title'>ブックマークをしまう</h1>
      <p className='pantry-workbench__lead'>
        URLを入れて、必要ならタイトルを取得してから保存します。
      </p>

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
            search: search.tags !== undefined ? { tags: search.tags } : {},
            state: { newBookmarkCreated: true }
          })
        }}
      />
    </section>
  )
}
