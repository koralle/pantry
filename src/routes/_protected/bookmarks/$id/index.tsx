import { ORPCError } from '@orpc/client'
import { createFileRoute, useRouter, useRouterState } from '@tanstack/react-router'
import { CircleCheck } from 'lucide-react'
import { Suspense } from 'react'
import type { FallbackProps } from 'react-error-boundary'
import { ErrorBoundary } from 'react-error-boundary'
import { css } from 'styled-system/css'

import { BookmarkDetailResolved } from '../../../../features/bookmarks/components/bookmark-detail-resolved'
import { BookmarkDetailSkeleton } from '../../../../features/bookmarks/components/bookmark-detail-skeleton'
import { bookmarkDetailQueryOptions } from '../../../../features/bookmarks/lib/bookmark-detail-query-options'
import { bookmarkDetailSearchSchema } from '../../../../features/navigation/lib/bookmark-search'
import { listSearchFromDetail } from '../../../../features/navigation/lib/bookmark-search-builders'
import { StyledLink } from '../../../../shared/components/styled-link'
import { UiEmpty } from '../../../../shared/components/ui-empty'
import { UiError } from '../../../../shared/components/ui-error'
import { flash } from '../../../../styles/flash'

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
    const tags = useRouterState({
      select: (s) => (s.location.search as { tags?: string[] | undefined }).tags
    })

    return (
      <UiEmpty
        title='このブックマークは見つかりません'
        action={
          <StyledLink
            to='/'
            search={listSearchFromDetail({ tags })}
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

export const Route = createFileRoute('/_protected/bookmarks/$id/')({
  validateSearch: bookmarkDetailSearchSchema,
  loader: async ({ params, context }) => {
    // Route component と同じ query options を先に温める。
    void context.queryClient.prefetchQuery(bookmarkDetailQueryOptions(params.id))

    return {}
  },
  component: RouteComponent
})

function RouteComponent() {
  const { id } = Route.useParams()
  const search = Route.useSearch()
  const listSearch = listSearchFromDetail(search)
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
