import { getRouteApi, Link, useRouter } from '@tanstack/react-router'
import { Package, Plus } from 'lucide-react'
import { Suspense, use } from 'react'
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'
import { css, cx } from 'styled-system/css'

import { UiEmpty, UiError, UiLoading } from '../../../components/ui-state'
import { surface, textLink } from '../../../styles/ui'
import { sortTagsForEntrance } from '../tag-shelf'
import type { ShelfTag } from '../tag-shelf'
import { touchTagLastUsed } from '../tag.function'
import { tagShelfSearch } from './shelf-nav'

const protectedRouteApi = getRouteApi('/_protected')

const entranceGrid = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '3',
  margin: '0',
  padding: '0',
  listStyle: 'none'
})

const entranceBox = cx(
  surface,
  css({
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5',
    minBlockSize: '5.5rem',
    textDecoration: 'none',
    color: 'fg.default',
    position: 'relative',
    overflow: 'hidden',
    paddingBlockStart: '5'
  })
)

const entranceBoxStripe = css({
  position: 'absolute',
  insetInline: '0',
  insetBlockStart: '0',
  blockSize: '4',
  background: 'border.default'
})

const entranceBoxName = css({
  fontWeight: 'bold',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
})

const entranceBoxCount = css({
  color: 'fg.muted',
  fontSize: 'xs',
  fontVariantNumeric: 'tabular-nums'
})

const entranceEmptyActions = css({
  display: 'flex',
  flexWrap: 'wrap',
  rowGap: '3',
  columnGap: '5',
  justifyContent: 'center'
})

const entranceTitle = css({
  margin: '0',
  marginBlockEnd: '4',
  fontSize: 'lg',
  fontWeight: 'bold'
})

function EntranceError({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <UiError
      message={getErrorMessage(error) ?? '箱の読み込みに失敗しました'}
      onRetry={resetErrorBoundary}
    />
  )
}

function EntranceLoading() {
  return (
    <div
      className={entranceGrid}
      aria-busy='true'>
      <UiLoading label='箱を読み込み中' />
      <UiLoading label='箱を読み込み中' />
      <UiLoading label='箱を読み込み中' />
      <UiLoading label='箱を読み込み中' />
    </div>
  )
}

function EntranceBoxesIdeal({ tags }: { readonly tags: ShelfTag[] }) {
  const sorted = sortTagsForEntrance(tags)

  if (sorted.length === 0) {
    return (
      <UiEmpty
        title='まだ箱がありません'
        action={
          <div className={entranceEmptyActions}>
            <Link
              to='/tags/new'
              className={textLink}>
              <Plus
                size={16}
                aria-hidden
              />{' '}
              タグを作成
            </Link>
            <Link
              to='/bookmarks/new'
              className={textLink}>
              <Plus
                size={16}
                aria-hidden
              />{' '}
              新規ブックマーク
            </Link>
          </div>
        }
      />
    )
  }

  return (
    <ul className={entranceGrid}>
      {sorted.map((tag) => (
        <li key={tag.id}>
          <Link
            to='/'
            search={tagShelfSearch(tag.name)}
            className={entranceBox}
            onClick={() => {
              void touchTagLastUsed({ data: { id: tag.id } })
            }}>
            <span
              className={entranceBoxStripe}
              style={tag.color != null ? { backgroundColor: tag.color } : undefined}
              aria-hidden='true'
            />
            <span className={entranceBoxName}>
              <Package
                size={16}
                aria-hidden
              />{' '}
              {tag.name}
            </span>
            <span className={entranceBoxCount}>{tag.bookmarkCount}件</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function EntranceBoxesAsync({
  shelfTagsPromise
}: {
  readonly shelfTagsPromise: Promise<ShelfTag[]>
}) {
  const tags = use(shelfTagsPromise)
  return <EntranceBoxesIdeal tags={tags} />
}

export function EntranceBoxes() {
  const { shelfTagsPromise } = protectedRouteApi.useLoaderData()
  const router = useRouter()

  return (
    <section aria-label='玄関'>
      <h1 className={entranceTitle}>玄関</h1>
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
