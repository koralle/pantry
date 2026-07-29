import { useRouter } from '@tanstack/react-router'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { css } from 'styled-system/css'

import { createErrorFallback } from '../../../shared/components/error-fallback'
import type { ShelfTag } from '../lib/tag-shelf'
import { EntranceBoxesAsync } from './entrance-boxes-async'
import { EntranceLoading } from './entrance-boxes-loading'

const entranceTitle = css({
  margin: '0',
  marginBlockEnd: '4',
  fontSize: 'lg',
  fontWeight: 'bold'
})

const EntranceError = createErrorFallback('箱の読み込みに失敗しました')

export function EntranceBoxes({
  shelfTagsPromise
}: {
  readonly shelfTagsPromise: Promise<ShelfTag[]>
}) {
  const router = useRouter()

  return (
    <section aria-label='玄関'>
      <h1 className={entranceTitle}>玄関</h1>
      <ErrorBoundary
        FallbackComponent={EntranceError}
        onReset={() => {
          void router.invalidate()
        }}>
        <Suspense fallback={<EntranceLoading />}>
          <EntranceBoxesAsync shelfTagsPromise={shelfTagsPromise} />
        </Suspense>
      </ErrorBoundary>
    </section>
  )
}
