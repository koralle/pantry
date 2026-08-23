import { ORPCError } from '@orpc/client'
import { useRouter, useRouterState } from '@tanstack/react-router'
import { CircleCheck } from 'lucide-react'
import { Suspense } from 'react'
import type { FallbackProps } from 'react-error-boundary'
import { ErrorBoundary } from 'react-error-boundary'
import { css } from 'styled-system/css'

import { StyledLink } from '../../../shared/components/styled-link'
import { UiEmpty } from '../../../shared/components/ui-empty'
import { UiError } from '../../../shared/components/ui-error'
import { flash } from '../../../styles/flash'
import { buildListBackSearch } from '../../navigation/lib/bookmark-search-builders'
import { BookmarkDetailResolved } from './bookmark-detail-resolved'
import { BookmarkDetailSkeleton } from './bookmark-detail-skeleton'

const detailLayout = css({
  maxInlineSize: '42rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '6'
})

function isBookmarkNotFound(error: unknown): boolean {
  return error instanceof ORPCError && error.defined && error.code === 'bookmark-not-found'
}

function DetailFallback({ error, resetErrorBoundary }: FallbackProps) {
  if (isBookmarkNotFound(error)) {
    // 404 は画面の状態として扱う。router state から list search を組み立て直す。
    const tags = useRouterState({
      select: (s) => (s.location.search as { tags?: string[] | undefined }).tags
    })

    return (
      <UiEmpty
        title='このブックマークは見つかりません'
        action={
          <StyledLink
            to='/'
            search={buildListBackSearch(tags)}
            visual='accent'>
            一覧へ戻る
          </StyledLink>
        }
      />
    )
  }

  return (
    <UiError
      message='詳細の読み込みに失敗しました'
      onRetry={resetErrorBoundary}
    />
  )
}

export function BookmarkDetailScreen({
  id,
  listSearch
}: {
  readonly id: string
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
        FallbackComponent={DetailFallback}
        onReset={() => {
          void router.invalidate()
        }}>
        <Suspense fallback={<BookmarkDetailSkeleton />}>
          <BookmarkDetailResolved
            id={id}
            listSearch={listSearch}
          />
        </Suspense>
      </ErrorBoundary>
    </section>
  )
}
