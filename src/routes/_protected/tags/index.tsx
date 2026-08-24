import {
  createFileRoute,
  ErrorComponent,
  ErrorComponentProps,
  getRouteApi,
  Link
} from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { css } from 'styled-system/css'
import * as v from 'valibot'

import { InlineAddTag } from '../../../features/tags/components/inline-add-tag'
import { TagTable } from '../../../features/tags/components/tag-table'
import { TagTableSkeleton } from '../../../features/tags/components/tag-table-skeleton'
import { offsetPaginationQuerySchema } from '../../../schemas/pagination'
import { createErrorFallback } from '../../../shared/components/error-fallback'
import { button } from '../../../styles/button'
import { pageLead, pageTitle } from '../../../styles/type'

const tagsSearchSchema = v.object({
  ...offsetPaginationQuerySchema.entries
})

const protectedRouteApi = getRouteApi('/_protected')

const tagAdmin = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '5',
  maxInlineSize: '48rem'
})

const tagAdminHeader = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '4'
})

const tagAdminIntro = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  minInlineSize: '12rem',
  flex: '1'
})

const TagsError = createErrorFallback('タグの読み込みに失敗しました')

export const Route = createFileRoute('/_protected/tags/')({
  validateSearch: (search) => v.parse(tagsSearchSchema, search),
  component: RouteComponent,
  errorComponent: TagPageFallbackComponent
})

function TagPageFallbackComponent({ error }: ErrorComponentProps) {
  return <ErrorComponent error={error} />
}

function RouteComponent() {
  const { shelfTagsPromise } = protectedRouteApi.useLoaderData()

  return (
    <div className={tagAdmin}>
      <header className={tagAdminHeader}>
        <div className={tagAdminIntro}>
          <h1 className={pageTitle}>タグ管理</h1>
          <p className={pageLead}>名前・ピン・色を整えます</p>
        </div>
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
          <TagTable tagPromise={shelfTagsPromise} />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
