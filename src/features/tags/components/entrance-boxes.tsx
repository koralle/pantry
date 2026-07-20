import { getRouteApi, Link, useRouter } from '@tanstack/react-router'
import { Suspense, use } from 'react'
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'

import { UiEmpty, UiError, UiLoading } from '../../../components/ui-state'
import { sortTagsForEntrance } from '../tag-shelf'
import type { ShelfTag } from '../tag-shelf'
import { touchTagLastUsed } from '../tag.function'
import { tagShelfSearch } from './shelf-nav'

const protectedRouteApi = getRouteApi('/_protected')

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
      className='pantry-entrance-grid'
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
          <div className='pantry-entrance-empty-actions'>
            <Link to='/tags/new'>タグを作成</Link>
            <Link to='/bookmarks/new'>新規ブックマーク</Link>
          </div>
        }
      />
    )
  }

  return (
    <ul className='pantry-entrance-grid'>
      {sorted.map((tag) => (
        <li key={tag.id}>
          <Link
            to='/'
            search={tagShelfSearch(tag.name)}
            className='pantry-box pantry-entrance-box'
            onClick={() => {
              void touchTagLastUsed({ data: { id: tag.id } })
            }}>
            <span
              className='pantry-entrance-box__stripe'
              style={tag.color != null ? { backgroundColor: tag.color } : undefined}
              aria-hidden='true'
            />
            <span className='pantry-entrance-box__name'>{tag.name}</span>
            <span className='pantry-entrance-box__count'>{tag.bookmarkCount}件</span>
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
    <section
      className='pantry-entrance'
      aria-label='玄関'>
      <h1 className='pantry-entrance__title'>玄関</h1>
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
