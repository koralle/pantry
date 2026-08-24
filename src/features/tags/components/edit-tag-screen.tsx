import { useMutation } from '@tanstack/react-query'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { orpc } from '../../../rpc/query'
import { createErrorFallback } from '../../../shared/components/error-fallback'
import { StyledLink } from '../../../shared/components/styled-link'
import { UiLoading } from '../../../shared/components/ui-loading'
import { workbench, workbenchLead, workbenchNav, workbenchTitle } from '../../../styles/workbench'
import type { getTag } from '../functions/get-tag'
import { refreshAfterUpdateTag } from '../lib/refresh-after-update-tag'
import { EditTagForm } from './edit-tag-form'

type TagRecord = Awaited<ReturnType<typeof getTag>>

type EditTagScreenProps = {
  readonly tagPromise: Promise<TagRecord>
}

const EditError = createErrorFallback('タグの読み込みに失敗しました')

export function EditTagScreen({ tagPromise }: EditTagScreenProps) {
  const navigate = useNavigate()
  const router = useRouter()
  const mutation = useMutation(
    orpc.tags.update.mutationOptions({
      onSuccess: () => {
        refreshAfterUpdateTag(router)
      }
    })
  )

  async function submitAction(input: {
    id: number
    name: string
    pinned: boolean
    color: string | null
    sortOrder: number
  }) {
    const { id: updatedId } = await mutation.mutateAsync(input)

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
