import { ChevronDown } from 'lucide-react'
import { use } from 'react'
import { css, cx } from 'styled-system/css'

import { PantryMotion } from '../../../shared/components/pantry-motion'
import { StyledLink } from '../../../shared/components/styled-link'
import { UiEmpty } from '../../../shared/components/ui-empty'
import { UiError } from '../../../shared/components/ui-error'
import { button } from '../../../styles/button'
import type { BookmarkSearchSchema } from '../../navigation/lib/bookmark-search'
import {
  buildListSearch,
  detailSearchFromList
} from '../../navigation/lib/bookmark-search-builders'
import { useBookmarkListPagination } from '../hooks/use-bookmark-list-pagination'
import type { BookmarkListItem } from '../lib/attach-bookmark-tags'
import type { ListLayout } from '../lib/list-layout-preference'
import { BookmarkCardList } from './bookmark-card-list'
import { BookmarkTable } from './bookmark-table'

const partialSection = css({ marginBlockStart: '5', display: 'flex', justifyContent: 'center' })
const loadMoreButton = cx(
  button(),
  css({
    borderColor: 'accent.solid',
    color: 'accent.solid',
    fontWeight: 'semibold',
    minInlineSize: '12rem',
    _disabled: { opacity: '0.6', cursor: 'wait' }
  })
)

function hasActiveConditions(search: BookmarkSearchSchema): boolean {
  return Boolean(search.q?.trim()) || (search.tags !== undefined && search.tags.length > 0)
}

export function BookmarkListResults({
  bookmarkPromise,
  layout,
  search,
  pageLimit
}: {
  readonly bookmarkPromise: Promise<BookmarkListItem[]>
  readonly layout: ListLayout
  readonly search: BookmarkSearchSchema
  readonly pageLimit: number
}) {
  const initial = use(bookmarkPromise)
  const { items, hasMore, loadMoreError, isLoadingMore, loadMore } = useBookmarkListPagination({
    initial,
    pageLimit,
    search
  })

  if (items.length === 0) {
    if (hasActiveConditions(search)) {
      const hasQ = Boolean(search.q?.trim())
      const hasTags = search.tags !== undefined && search.tags.length > 0
      return (
        <UiEmpty
          title='条件に合うブックマークがありません'
          action={
            <StyledLink
              to='/'
              search={buildListSearch(search, {
                clearQ: hasQ,
                clearTags: hasTags
              })}
              visual='accent'>
              条件をクリア
            </StyledLink>
          }
        />
      )
    }

    return (
      <UiEmpty
        title='まだブックマークがありません'
        action={
          <StyledLink
            to='/bookmarks/new'
            search={detailSearchFromList(search)}
            visual='accent'>
            新規
          </StyledLink>
        }
      />
    )
  }

  const detailSearch = detailSearchFromList(search)

  return (
    <div>
      <PantryMotion
        key={layout}
        kind='crossfade'>
        {layout === 'card' ? (
          <BookmarkCardList
            bookmarks={items}
            detailSearch={detailSearch}
          />
        ) : (
          <BookmarkTable
            bookmarks={items}
            detailSearch={detailSearch}
          />
        )}
      </PantryMotion>

      {hasMore ? (
        <div className={partialSection}>
          {loadMoreError != null ? (
            <UiError
              message={loadMoreError}
              onRetry={loadMore}
            />
          ) : (
            <button
              type='button'
              className={loadMoreButton}
              disabled={isLoadingMore}
              onClick={loadMore}>
              <ChevronDown
                size={16}
                aria-hidden
              />{' '}
              {isLoadingMore ? '読み込み中…' : 'さらに読み込む'}
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}
