import { useRouter } from '@tanstack/react-router'
import { Suspense } from 'react'
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'

import { UiError, UiLoading } from '../../../shared/components/ui-state'
import type { ShelfNavSelection } from '../../tags/components/shelf-nav'
import { ShelfNavAsync } from '../../tags/components/shelf-nav'
import type { ShelfTag } from '../../tags/lib/tag-shelf'

function ShelfNavError({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <UiError
      message={getErrorMessage(error) ?? '棚の読み込みに失敗しました'}
      onRetry={resetErrorBoundary}
    />
  )
}

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
