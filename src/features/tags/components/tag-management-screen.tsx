import { Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { css } from 'styled-system/css'

import { createErrorFallback } from '../../../shared/components/error-fallback'
import { button } from '../../../styles/button'
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

const TagsError = createErrorFallback('タグの読み込みに失敗しました')

export function TagManagementScreen({
  tagsPromise
}: {
  readonly tagsPromise: Promise<ShelfTag[]>
}) {
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
