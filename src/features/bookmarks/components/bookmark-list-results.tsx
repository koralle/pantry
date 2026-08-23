import { useSuspenseQuery } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import { css } from 'styled-system/css'

import { PantryMotion } from '../../../shared/components/pantry-motion'
import { StyledButton } from '../../../shared/components/styled-button'
import { StyledLink } from '../../../shared/components/styled-link'
import { UiEmpty } from '../../../shared/components/ui-empty'
import { UiError } from '../../../shared/components/ui-error'
import type { BookmarkSearchSchema } from '../../navigation/lib/bookmark-search'
import {
  buildListSearch,
  detailSearchFromList
} from '../../navigation/lib/bookmark-search-builders'
import { useBookmarkListPagination } from '../hooks/use-bookmark-list-pagination'
import { bookmarkListQueryOptions } from '../lib/bookmark-list-query-options'
import type { ListLayout } from '../lib/list-layout-preference'
import { BookmarkCardList } from './bookmark-card-list'
import { BookmarkTable } from './bookmark-table'

const partialSection = css({ marginBlockStart: '5', display: 'flex', justifyContent: 'center' })
const loadMoreButton = css({
  borderColor: 'accent.solid',
  color: 'accent.solid',
  fontWeight: 'semibold',
  minInlineSize: '12rem'
})

function hasActiveConditions(search: BookmarkSearchSchema): boolean {
  return Boolean(search.q?.trim()) || (search.tags !== undefined && search.tags.length > 0)
}

export function BookmarkListResults({
  layout,
  search,
  pageLimit
}: {
  readonly layout: ListLayout
  readonly search: BookmarkSearchSchema
  readonly pageLimit: number
}) {
  // Loader が prefetch した同じ query options を読む。未取得ならここで suspend する。
  const { data } = useSuspenseQuery(
    bookmarkListQueryOptions({
      tagMode: search.tagMode,
      sort: search.sort,
      limit: search.limit,
      offset: search.offset,
      ...(search.q !== undefined ? { q: search.q } : {}),
      ...(search.tags !== undefined ? { tags: search.tags } : {})
    })
  )
  const { items, hasMore, loadMoreError, isLoadingMore, loadMore } = useBookmarkListPagination({
    initial: data,
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
            <StyledButton
              className={loadMoreButton}
              isDisabled={isLoadingMore}
              onPress={loadMore}>
              <ChevronDown
                size={16}
                aria-hidden
              />{' '}
              {isLoadingMore ? '読み込み中…' : 'さらに読み込む'}
            </StyledButton>
          )}
        </div>
      ) : null}
    </div>
  )
}
