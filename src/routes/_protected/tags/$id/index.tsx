import { createFileRoute, Link, useRouter, useRouterState } from '@tanstack/react-router'
import { ArrowLeft, Bookmark, CircleCheck, Pencil, Pin } from 'lucide-react'
import { Suspense, use } from 'react'
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'
import * as v from 'valibot'

import { UiError, UiLoading } from '../../../../components/ui-state'
import type { TagSelectType } from '../../../../db/schema/tag'
import { tagShelfSearch } from '../../../../features/tags/components/shelf-nav'
import { getTag } from '../../../../features/tags/tag.function'

const tagIdParamSchema = v.pipe(v.string(), v.transform(Number), v.integer('Invalid tag id'))

const tagDetailSearchSchema = v.object({
  created: v.optional(v.boolean())
})

export const Route = createFileRoute('/_protected/tags/$id/')({
  validateSearch: tagDetailSearchSchema,
  loader: async ({ params }) => {
    const id = v.parse(tagIdParamSchema, params.id)
    const tagPromise = getTag({ data: { id } })
    return { tagPromise }
  },
  component: RouteComponent
})

function DetailError({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <UiError
      message={getErrorMessage(error) ?? 'タグの読み込みに失敗しました'}
      onRetry={resetErrorBoundary}
    />
  )
}

function RouteComponent() {
  const { id } = Route.useParams()
  const { tagPromise } = Route.useLoaderData()
  const router = useRouter()

  const { newTagCreated, tagUpdated } = useRouterState({
    select: (s) => s.location.state
  })

  return (
    <div className='pantry-workbench'>
      {newTagCreated ? (
        <output className='pantry-flash'>
          <CircleCheck
            size={16}
            aria-hidden
          />{' '}
          タグを登録しました
        </output>
      ) : null}
      {tagUpdated ? (
        <output className='pantry-flash'>
          <CircleCheck
            size={16}
            aria-hidden
          />{' '}
          タグを更新しました
        </output>
      ) : null}

      <nav className='pantry-workbench__nav'>
        <Link
          to='/tags'
          search={{ limit: 50, offset: 0 }}
          className='pantry-text-link'>
          <ArrowLeft
            size={16}
            aria-hidden
          />{' '}
          一覧へ戻る
        </Link>
      </nav>

      <ErrorBoundary
        FallbackComponent={DetailError}
        onReset={() => {
          void router.invalidate()
        }}>
        <Suspense fallback={<UiLoading label='タグを読み込み中' />}>
          <TagDetail
            id={id}
            tagPromise={tagPromise}
          />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}

function TagDetail({
  id,
  tagPromise
}: {
  readonly id: string
  readonly tagPromise: Promise<TagSelectType>
}) {
  const tag = use(tagPromise)

  return (
    <>
      <header className='pantry-tag-detail__header'>
        <span
          className='pantry-shelf-dot pantry-tag-detail__dot'
          style={tag.color != null ? { backgroundColor: tag.color } : undefined}
          aria-hidden='true'
        />
        <h1 className='pantry-workbench__title'>{tag.name}</h1>
      </header>

      <dl className='pantry-tag-detail__meta'>
        <div>
          <dt>ピン</dt>
          <dd>
            {tag.pinned ? (
              <>
                <Pin
                  size={16}
                  aria-hidden
                />{' '}
                留めている
              </>
            ) : (
              'なし'
            )}
          </dd>
        </div>
        <div>
          <dt>並び順</dt>
          <dd>{tag.sortOrder}</dd>
        </div>
      </dl>

      <div className='pantry-detail__actions'>
        <Link
          to='/'
          search={tagShelfSearch(tag.name)}
          className='pantry-button pantry-button--accent'>
          <Bookmark
            size={16}
            aria-hidden
          />{' '}
          この棚のブックマークを見る
        </Link>
        <Link
          to='/tags/$id/edit'
          params={{ id }}
          className='pantry-button pantry-button--secondary'>
          <Pencil
            size={16}
            aria-hidden
          />{' '}
          編集
        </Link>
      </div>
    </>
  )
}
