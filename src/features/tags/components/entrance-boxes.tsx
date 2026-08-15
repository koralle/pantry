import { useRouter } from '@tanstack/react-router'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { css, cx } from 'styled-system/css'

import { createErrorFallback } from '../../../shared/components/error-fallback'
import { pageTitle } from '../../../styles/type'
import type { ShelfTag } from '../lib/tag-shelf'
import { EntranceBoxesAsync } from './entrance-boxes-async'
import { EntranceLoading } from './entrance-boxes-loading'

const entranceHeader = css({
  marginBlockEnd: '4'
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
      <h1 className={cx(pageTitle, entranceHeader)}>玄関</h1>
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
