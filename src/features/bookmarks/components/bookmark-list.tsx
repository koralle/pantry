import { Suspense } from 'react'

import { UiLoading } from '../../../shared/components/ui-loading'
import type { BookmarkSearchSchema } from '../../navigation/lib/bookmark-search'
import { useTouchTagLastUsedOnce } from '../../tags/hooks/use-touch-tag-last-used'
import type { ShelfTag } from '../../tags/lib/tag-shelf'
import { useListLayout } from '../hooks/use-list-layout'
import type { BookmarkListItem } from '../lib/attach-bookmark-tags'
import { BookmarkListFrame } from './bookmark-list-frame'
import { ListLoading } from './bookmark-list-loading'
import { ListToolbar } from './bookmark-list-toolbar'

type BookmarkListProps = {
  readonly search: BookmarkSearchSchema
  readonly bookmarksPromise: Promise<BookmarkListItem[]> | undefined
  readonly shelfTagsPromise: Promise<ShelfTag[]>
}

export function BookmarkList({ search, bookmarksPromise, shelfTagsPromise }: BookmarkListProps) {
  const [layout, changeLayout] = useListLayout()

  useTouchTagLastUsedOnce(search, shelfTagsPromise)

  if (bookmarksPromise === undefined) {
    return <UiLoading label='一覧を読み込み中' />
  }

  return (
    <section aria-label='ブックマーク一覧'>
      <Suspense
        fallback={
          <>
            <ListToolbar
              search={search}
              layout={layout}
              onLayoutChange={changeLayout}
              shelfTags={[]}
            />
            <ListLoading layout={layout} />
          </>
        }>
        <BookmarkListFrame
          search={search}
          layout={layout}
          changeLayout={changeLayout}
          shelfTagsPromise={shelfTagsPromise}
          bookmarksPromise={bookmarksPromise}
        />
      </Suspense>
    </section>
  )
}
