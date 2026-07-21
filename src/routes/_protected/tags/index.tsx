import { createFileRoute, ErrorComponent, ErrorComponentProps, Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Suspense } from 'react'
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'
import * as v from 'valibot'

import { UiError } from '../../../components/ui-state'
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
          <Plus
            size={16}
            aria-hidden
          />{' '}
          新規タグ
        </Link>
      </header>

      <InlineAddTag />

      <ErrorBoundary FallbackComponent={TagsError}>
        <Suspense fallback={<TagTableSkeleton />}>
          <TagTable tagPromise={tagsPromise} />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}

function TagTableSkeleton() {
  return (
    <div
      className='pantry-tag-table-skeleton'
      aria-busy='true'>
      <span className='pantry-sr-only'>タグを読み込み中</span>
      <table
        className='pantry-tag-table'
        aria-hidden='true'>
        <thead>
          <tr>
            <th scope='col'>色</th>
            <th scope='col'>名前</th>
            <th scope='col'>件数</th>
            <th scope='col'>ピン</th>
            <th scope='col'>
              <span className='pantry-sr-only'>操作</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {['a', 'b', 'c', 'd', 'e'].map((row) => (
            <tr key={row}>
              <td className='pantry-skeleton pantry-tag-table-skeleton__dot'>{'\u00a0'}</td>
              <td className='pantry-skeleton pantry-tag-table-skeleton__name'>{'\u00a0'}</td>
              <td className='pantry-skeleton pantry-tag-table-skeleton__count'>{'\u00a0'}</td>
              <td className='pantry-skeleton pantry-tag-table-skeleton__pin'>{'\u00a0'}</td>
              <td className='pantry-skeleton pantry-tag-table-skeleton__action'>{'\u00a0'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
