import { useSuspenseQuery } from '@tanstack/react-query'

import type { BookmarkSearchSchema } from '../../navigation/lib/bookmark-search'
import { bookmarkDetailQueryOptions } from '../lib/bookmark-detail-query-options'
import { BookmarkDetailContent } from './bookmark-detail-content'

export function BookmarkDetailResolved({
  id,
  listSearch
}: {
  readonly id: string
  readonly listSearch: BookmarkSearchSchema
}) {
  // Loader が prefetch した同じ query options を読む。未取得ならここで suspend する。
  const { data } = useSuspenseQuery(bookmarkDetailQueryOptions(id))

  return (
    <BookmarkDetailContent
      bookmark={data}
      listSearch={listSearch}
    />
  )
}
