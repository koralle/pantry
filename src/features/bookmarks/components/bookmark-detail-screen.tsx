import { useRouter, useRouterState } from '@tanstack/react-router'
import { CircleCheck } from 'lucide-react'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { css } from 'styled-system/css'

import { createErrorFallback } from '../../../shared/components/error-fallback'
import { flash } from '../../../styles/flash'
import type { buildListBackSearch } from '../../navigation/lib/bookmark-search-builders'
import type { loadBookmarkDetail } from '../loaders/load-bookmark-detail'
import { BookmarkDetailResolved } from './bookmark-detail-resolved'
import { BookmarkDetailSkeleton } from './bookmark-detail-skeleton'

const detailLayout = css({
  maxInlineSize: '42rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '6'
})

const DetailError = createErrorFallback('詳細の読み込みに失敗しました')

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
