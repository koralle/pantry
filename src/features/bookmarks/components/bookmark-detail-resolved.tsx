import { use } from 'react'

import { StyledLink } from '../../../shared/components/styled-link'
import { UiEmpty } from '../../../shared/components/ui-empty'
import type { buildListBackSearch } from '../../navigation/lib/bookmark-search-builders'
import type { loadBookmarkDetail } from '../loaders/load-bookmark-detail'
import { BookmarkDetailContent } from './bookmark-detail-content'

export function BookmarkDetailResolved({
  detailPromise,
  listSearch
}: {
  readonly detailPromise: ReturnType<typeof loadBookmarkDetail>
  readonly listSearch: ReturnType<typeof buildListBackSearch>
}) {
  const detail = use(detailPromise)

  if (detail.kind === 'not-found') {
    return (
      <UiEmpty
        title='このブックマークは見つかりません'
        action={
          <StyledLink
            to='/'
            search={listSearch}
            visual='accent'>
            一覧へ戻る
          </StyledLink>
        }
      />
    )
  }

  const { bookmark, tagNames } = detail

  return (
    <BookmarkDetailContent
      bookmark={bookmark}
      tagNames={tagNames}
      listSearch={listSearch}
    />
  )
}
