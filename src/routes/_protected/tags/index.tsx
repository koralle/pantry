import { createFileRoute, ErrorComponent, ErrorComponentProps, Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Suspense } from 'react'
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'
import { css, cx } from 'styled-system/css'
import * as v from 'valibot'

import { UiError } from '../../../components/ui-state'
import { ensureSession } from '../../../features/auth/auth.function'
import { InlineAddTag } from '../../../features/tags/components/inline-add-tag'
import { TagTable } from '../../../features/tags/tag-table'
import { fetchShelfTags } from '../../../features/tags/tag.function'
import { offsetPaginationQuerySchema } from '../../../schemas/pagination'
import { button, skeleton, srOnly } from '../../../styles/ui'

const tagsSearchSchema = v.object({
  ...offsetPaginationQuerySchema.entries
})

const tagAdmin = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '5',
  maxInlineSize: '48rem'
})

const tagAdminHeader = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  rowGap: '3',
  columnGap: '5'
})

const tagAdminTitle = css({
  margin: '0',
  fontSize: 'lg',
  fontWeight: 'bold'
})

const tagAdminLead = css({
  margin: '0',
  color: 'fg.muted',
  flex: '1',
  minInlineSize: '12rem'
})

const tagTable = css({
  width: 'full',
  borderCollapse: 'collapse'
})

const tagTableCell = css({
  borderBlockEndWidth: 'thin',
  borderBlockEndStyle: 'solid',
  borderBlockEndColor: 'border.default',
  paddingBlock: '3',
  paddingInline: '2',
  textAlign: 'start',
  verticalAlign: 'middle'
})

const tagTableHeader = css({
  color: 'fg.muted',
  fontSize: 'xs2',
  fontWeight: 'semibold'
})

const skeletonBase = css({
  display: 'block',
  borderWidth: 'none',
  padding: '0'
})

const skeletonDot = css({
  inlineSize: '3',
  blockSize: '3',
  borderRadius: 'full',
  minBlockSize: '0'
})

const skeletonName = css({
  inlineSize: 'min-10',
  minBlockSize: '4'
})

const skeletonCount = css({
  inlineSize: '8',
  minBlockSize: '4'
})

const skeletonPin = css({
  inlineSize: '10',
  minBlockSize: '4'
})

const skeletonAction = css({
  inlineSize: '10',
  minBlockSize: '4'
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
    <div className={tagAdmin}>
      <header className={tagAdminHeader}>
        <h1 className={tagAdminTitle}>タグ管理</h1>
        <p className={tagAdminLead}>箱のラベル・ピン・色を整える裏方です</p>
        <Link
          to='/tags/new'
          className={button({ visual: 'accent' })}>
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
    <div aria-busy='true'>
      <span className={srOnly}>タグを読み込み中</span>
      <table
        className={tagTable}
        aria-hidden='true'>
        <thead>
          <tr>
            <th
              scope='col'
              className={`${tagTableCell} ${tagTableHeader}`}>
              色
            </th>
            <th
              scope='col'
              className={`${tagTableCell} ${tagTableHeader}`}>
              名前
            </th>
            <th
              scope='col'
              className={`${tagTableCell} ${tagTableHeader}`}>
              件数
            </th>
            <th
              scope='col'
              className={`${tagTableCell} ${tagTableHeader}`}>
              ピン
            </th>
            <th
              scope='col'
              className={`${tagTableCell} ${tagTableHeader}`}>
              <span className={srOnly}>操作</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {['a', 'b', 'c', 'd', 'e'].map((row) => (
            <tr key={row}>
              <td className={cx(skeleton, skeletonBase, skeletonDot)}>{'\u00a0'}</td>
              <td className={cx(skeleton, skeletonBase, skeletonName)}>{'\u00a0'}</td>
              <td className={cx(skeleton, skeletonBase, skeletonCount)}>{'\u00a0'}</td>
              <td className={cx(skeleton, skeletonBase, skeletonPin)}>{'\u00a0'}</td>
              <td className={cx(skeleton, skeletonBase, skeletonAction)}>{'\u00a0'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
