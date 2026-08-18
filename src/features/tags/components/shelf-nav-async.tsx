import { use } from 'react'

import type { BookmarkSearchSchema } from '../../navigation/lib/bookmark-search'
import type { ShelfTag } from '../lib/tag-shelf'
import { ShelfNav } from './shelf-nav'
import type { ShelfNavSelection } from './shelf-nav'

type ShelfNavAsyncProps = {
  readonly shelfTagsPromise: Promise<ShelfTag[]>
  readonly selection: ShelfNavSelection
  readonly listSearch: BookmarkSearchSchema | undefined
  readonly onNavigate?: (() => void) | undefined
}

export function ShelfNavAsync({
  shelfTagsPromise,
  selection,
  listSearch,
  onNavigate
}: ShelfNavAsyncProps) {
  const tags = use(shelfTagsPromise)
  return (
    <ShelfNav
      tags={tags}
      selection={selection}
      listSearch={listSearch}
      onNavigate={onNavigate}
    />
  )
}
