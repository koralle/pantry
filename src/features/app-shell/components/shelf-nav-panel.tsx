import { useRouter } from '@tanstack/react-router'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { createErrorFallback } from '../../../shared/components/error-fallback'
import { UiLoading } from '../../../shared/components/ui-loading'
import type { ShelfNavSelection } from '../../tags/components/shelf-nav'
import { ShelfNavAsync } from '../../tags/components/shelf-nav-async'
import type { ShelfTag } from '../../tags/lib/tag-shelf'

const ShelfNavError = createErrorFallback('棚の読み込みに失敗しました')

export function ShelfNavPanel({
  shelfTagsPromise,
  selection,
  onNavigate
}: {
  readonly shelfTagsPromise: Promise<ShelfTag[]>
  readonly selection: ShelfNavSelection
  readonly onNavigate?: (() => void) | undefined
}) {
  const router = useRouter()

  return (
    <ErrorBoundary
      FallbackComponent={ShelfNavError}
      onReset={() => {
        void router.invalidate()
      }}>
      <Suspense fallback={<UiLoading label='棚を読み込み中' />}>
        <ShelfNavAsync
          shelfTagsPromise={shelfTagsPromise}
          selection={selection}
          onNavigate={onNavigate}
        />
      </Suspense>
    </ErrorBoundary>
  )
}
