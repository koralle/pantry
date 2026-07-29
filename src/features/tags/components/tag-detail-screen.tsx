import { useRouter, useRouterState } from '@tanstack/react-router'
import { ArrowLeft, CircleCheck } from 'lucide-react'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { createErrorFallback } from '../../../shared/components/error-fallback'
import { StyledLink } from '../../../shared/components/styled-link'
import { UiLoading } from '../../../shared/components/ui-loading'
import { flash } from '../../../styles/flash'
import { workbench, workbenchNav } from '../../../styles/workbench'
import type { getTag } from '../functions/get-tag'
import { TagDetail } from './tag-detail'

type TagDetailScreenProps = {
  readonly id: string
  readonly tagPromise: Promise<Awaited<ReturnType<typeof getTag>>>
}

const DetailError = createErrorFallback('タグの読み込みに失敗しました')

export function TagDetailScreen({ id, tagPromise }: TagDetailScreenProps) {
  const router = useRouter()

  const { newTagCreated, tagUpdated } = useRouterState({
    select: (s) => s.location.state
  })

  return (
    <div className={workbench}>
      {newTagCreated ? (
        <output className={flash}>
          <CircleCheck
            size={16}
            aria-hidden
          />{' '}
          タグを登録しました
        </output>
      ) : null}
      {tagUpdated ? (
        <output className={flash}>
          <CircleCheck
            size={16}
            aria-hidden
          />{' '}
          タグを更新しました
        </output>
      ) : null}

      <nav className={workbenchNav}>
        <StyledLink
          to='/tags'
          search={{ limit: 50, offset: 0 }}
          visual='accent'>
          <ArrowLeft
            size={16}
            aria-hidden
          />{' '}
          一覧へ戻る
        </StyledLink>
      </nav>

      <ErrorBoundary
        FallbackComponent={DetailError}
        onReset={() => {
          void router.invalidate()
        }}>
        <Suspense fallback={<UiLoading label='タグを読み込み中' />}>
          <TagDetail
            id={id}
            tagPromise={tagPromise}
          />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
