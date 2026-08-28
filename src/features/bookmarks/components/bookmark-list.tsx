import { Suspense } from 'react'

import type { BookmarkSearchSchema } from '../../navigation/lib/bookmark-search'
import { useTouchTagLastUsedOnce } from '../../tags/hooks/use-touch-tag-last-used'
import type { ShelfTag } from '../../tags/lib/tag-shelf'
import { useListLayout } from '../hooks/use-list-layout'
import { rememberBookmarkListScroll } from '../lib/bookmark-list-scroll-session'
import { BookmarkListFrame } from './bookmark-list-frame'
import { ListLoading } from './bookmark-list-loading'
import { ListToolbar } from './bookmark-list-toolbar'

type BookmarkListProps = {
  readonly search: BookmarkSearchSchema
  readonly shelfTagsPromise: Promise<ShelfTag[]>
}

export function BookmarkList({ search, shelfTagsPromise }: BookmarkListProps) {
  const [layout, setLayout] = useListLayout()

  const changeLayout = (next: typeof layout) => {
    setLayout(next)
    rememberBookmarkListScroll(search, 0)
    window.scrollTo(0, 0)
  }

  useTouchTagLastUsedOnce(search, shelfTagsPromise)

  return (
    <section>
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
        />
      </Suspense>
    </section>
  )
}
