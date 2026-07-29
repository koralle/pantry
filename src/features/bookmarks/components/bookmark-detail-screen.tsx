import { useRouter, useRouterState } from '@tanstack/react-router'
import { CircleCheck } from 'lucide-react'
import { Suspense, use } from 'react'
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'
import { css } from 'styled-system/css'

import { StyledLink } from '../../../shared/components/styled-link'
import { UiEmpty, UiError } from '../../../shared/components/ui-state'
import { flash } from '../../../styles/flash'
import { buildListBackSearch } from '../../navigation/lib/bookmark-search-builders'
import type { loadBookmarkDetail } from '../loaders/load-bookmark-detail'
import { BookmarkDetailContent } from './bookmark-detail-content'
import { BookmarkDetailSkeleton } from './bookmark-detail-skeleton'

const detailLayout = css({
  maxInlineSize: '42rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '6'
})

function DetailError({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <UiError
      message={getErrorMessage(error) ?? '詳細の読み込みに失敗しました'}
      onRetry={resetErrorBoundary}
    />
  )
}

export function BookmarkDetailScreen({
  detailPromise,
  listSearch
}: {
  readonly detailPromise: ReturnType<typeof loadBookmarkDetail>
  readonly listSearch: ReturnType<typeof buildListBackSearch>
}) {
  const router = useRouter()

  const { newBookmarkCreated, bookmarkUpdated } = useRouterState({
    select: (s) => s.location.state
  })

  return (
    <section
      className={detailLayout}
      aria-label='ブックマーク詳細'>
      {newBookmarkCreated ? (
        <div
          className={flash}
          role='alert'>
          <CircleCheck
            size={16}
            aria-hidden
          />{' '}
          ブックマークを登録しました
        </div>
      ) : null}
      {bookmarkUpdated ? (
        <div
          className={flash}
          role='alert'>
          <CircleCheck
            size={16}
            aria-hidden
          />{' '}
          ブックマークを更新しました
        </div>
      ) : null}

      <ErrorBoundary
        FallbackComponent={DetailError}
        onReset={() => {
          void router.invalidate()
        }}>
        <Suspense fallback={<BookmarkDetailSkeleton />}>
          <BookmarkDetailResolved
            detailPromise={detailPromise}
            listSearch={listSearch}
          />
        </Suspense>
      </ErrorBoundary>
    </section>
  )
}

function BookmarkDetailResolved({
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
