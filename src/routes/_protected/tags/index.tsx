import { createFileRoute, ErrorComponent, ErrorComponentProps, Link } from '@tanstack/react-router'
import { Suspense } from 'react'
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'
import * as v from 'valibot'

import { UiError, UiLoading } from '../../../components/ui-state'
import { ensureSession } from '../../../features/auth/auth.function'
import { InlineAddTag } from '../../../features/tags/components/inline-add-tag'
import { TagTable } from '../../../features/tags/tag-table'
import { fetchShelfTags } from '../../../features/tags/tag.function'
import { offsetPaginationQuerySchema } from '../../../schemas/pagination'

const tagsSearchSchema = v.object({
  ...offsetPaginationQuerySchema.entries
})

export const Route = createFileRoute('/_protected/tags/')({
  validateSearch: (search) => v.parse(tagsSearchSchema, search),
  loader: async () => {
    const { user } = await ensureSession()
    const tagsPromise = fetchShelfTags()

    return {
      user,
      tagsPromise
    }
  },
  component: RouteComponent,
  errorComponent: TagPageFallbackComponent
})

function TagPageFallbackComponent({ error }: ErrorComponentProps) {
  return <ErrorComponent error={error} />
}

function TagsError({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <UiError
      message={getErrorMessage(error) ?? 'タグの読み込みに失敗しました'}
      onRetry={resetErrorBoundary}
    />
  )
}

function RouteComponent() {
  const { tagsPromise } = Route.useLoaderData()

  return (
    <div className='pantry-tag-admin'>
      <header className='pantry-tag-admin__header'>
        <h1 className='pantry-tag-admin__title'>タグ管理</h1>
        <p className='pantry-tag-admin__lead'>箱のラベル・ピン・色を整える裏方です</p>
        <Link
          to='/tags/new'
          className='pantry-button pantry-button--accent'>
          新規タグ
        </Link>
      </header>

      <InlineAddTag />

      <ErrorBoundary FallbackComponent={TagsError}>
        <Suspense fallback={<UiLoading label='タグを読み込み中' />}>
          <TagTable tagPromise={tagsPromise} />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
