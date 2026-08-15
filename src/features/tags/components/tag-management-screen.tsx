import { Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { css } from 'styled-system/css'

import { createErrorFallback } from '../../../shared/components/error-fallback'
import { button } from '../../../styles/button'
import { pageLead, pageTitle } from '../../../styles/type'
import type { ShelfTag } from '../lib/tag-shelf'
import { InlineAddTag } from './inline-add-tag'
import { TagTable } from './tag-table'
import { TagTableSkeleton } from './tag-table-skeleton'

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

export function TagManagementScreen({
  tagsPromise
}: {
  readonly tagsPromise: Promise<ShelfTag[]>
}) {
  return (
    <div className={tagAdmin}>
      <header className={tagAdminHeader}>
        <div className={tagAdminIntro}>
          <h1 className={pageTitle}>タグ管理</h1>
          <p className={pageLead}>箱のラベル・ピン・色を整える裏方です</p>
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
          <TagTable tagPromise={tagsPromise} />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
