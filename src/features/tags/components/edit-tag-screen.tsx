import { useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Suspense, use } from 'react'
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'

import { StyledLink } from '../../../shared/components/styled-link'
import { UiError, UiLoading } from '../../../shared/components/ui-state'
import { workbench, workbenchLead, workbenchNav, workbenchTitle } from '../../../styles/workbench'
import type { getTag } from '../functions/get-tag'
import { updateTag } from '../functions/update-tag'
import { TagForm } from './tag-form'

type TagRecord = Awaited<ReturnType<typeof getTag>>

type EditTagScreenProps = {
  readonly tagPromise: Promise<TagRecord>
}

type EditTagFormProps = {
  readonly tagPromise: Promise<TagRecord>
  readonly submitAction: (input: {
    id: number
    name: string
    pinned: boolean
    color: string | null
    sortOrder: number
  }) => Promise<void>
}

function EditError({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <UiError
      message={getErrorMessage(error) ?? 'タグの読み込みに失敗しました'}
      onRetry={resetErrorBoundary}
    />
  )
}

export function EditTagScreen({ tagPromise }: EditTagScreenProps) {
  const navigate = useNavigate()
  const router = useRouter()

  async function submitAction(input: {
    id: number
    name: string
    pinned: boolean
    color: string | null
    sortOrder: number
  }) {
    const { id: updatedId } = await updateTag({
      data: {
        id: input.id,
        name: input.name,
        pinned: input.pinned,
        color: input.color,
        sortOrder: input.sortOrder
      }
    })

    await router.invalidate()
    await navigate({
      to: '/tags/$id',
      params: { id: String(updatedId) },
      state: { tagUpdated: true }
    })
  }

  return (
    <div className={workbench}>
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

      <h1 className={workbenchTitle}>タグ編集</h1>
      <p className={workbenchLead}>名前・ピン・色・並び順を更新します</p>

      <ErrorBoundary FallbackComponent={EditError}>
        <Suspense fallback={<UiLoading label='タグを読み込み中' />}>
          <EditTagForm
            tagPromise={tagPromise}
            submitAction={submitAction}
          />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}

function EditTagForm({ tagPromise, submitAction }: EditTagFormProps) {
  const tag = use(tagPromise)

  return (
    <TagForm
      initialValues={{
        name: tag.name,
        pinned: tag.pinned,
        color: tag.color,
        sortOrder: tag.sortOrder
      }}
      legend='タグ編集'
      submitLabel='更新'
      pendingLabel='更新中...'
      onSubmit={async ({ name, pinned, color, sortOrder }) => {
        await submitAction({
          id: tag.id,
          name,
          pinned,
          color,
          sortOrder
        })
      }}
      mapError={(error) => (error instanceof Error ? error.message : 'タグの更新に失敗しました')}
    />
  )
}
