import { Dialog } from '@base-ui/react/dialog'
import {
  createFileRoute,
  Link,
  useNavigate,
  useRouter,
  useRouterState
} from '@tanstack/react-router'
import { Suspense, use, useState, useTransition } from 'react'
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'
import * as v from 'valibot'

import { buildListBackSearch } from '../-lib/list-back-search'
import { UiEmpty, UiError } from '../../../../components/ui-state'
import { deleteBookmark, getBookmark } from '../../../../features/bookmarks/bookmark.function'
import { fetchTags } from '../../../../features/tags/tag.function'
import { formatDateTime } from '../../../../lib/format-date'

const bookmarkDetailSearchSchema = v.object({
  tags: v.optional(v.array(v.string()))
})

export const Route = createFileRoute('/_protected/bookmarks/$id/')({
  validateSearch: bookmarkDetailSearchSchema,
  loader: async ({ params }) => {
    const detailPromise = loadDetail(params.id)
    return { detailPromise }
  },
  component: RouteComponent
})

async function loadDetail(id: string) {
  try {
    const bookmark = await getBookmark({ data: { id } })
    const tags = await fetchTags({ data: { limit: 1000, offset: 0 } })
    const tagNames = tags.filter((tag) => bookmark.tagIds.includes(tag.id)).map((tag) => tag.name)
    return { kind: 'ok' as const, bookmark, tagNames }
  } catch (error) {
    if (error instanceof Error && error.message === 'Bookmark not found') {
      return { kind: 'not-found' as const }
    }
    throw error
  }
}

function DetailError({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <UiError
      message={getErrorMessage(error) ?? '詳細の読み込みに失敗しました'}
      onRetry={resetErrorBoundary}
    />
  )
}

function DetailSkeleton() {
  return (
    <div
      className='pantry-detail'
      aria-busy='true'>
      <span className='pantry-sr-only'>詳細を読み込み中</span>
      <div className='pantry-detail__nav'>
        <div
          className='pantry-skeleton pantry-detail__skeleton-line pantry-detail__skeleton-line--nav'
          aria-hidden='true'
        />
      </div>
      <header className='pantry-detail__header'>
        <div
          className='pantry-skeleton pantry-detail__skeleton-line pantry-detail__skeleton-line--title'
          aria-hidden='true'
        />
        <div
          className='pantry-skeleton pantry-detail__skeleton-line pantry-detail__skeleton-line--url'
          aria-hidden='true'
        />
      </header>
      <div
        className='pantry-skeleton pantry-detail__skeleton-block pantry-detail__skeleton-block--note'
        aria-hidden='true'
      />
      <div
        className='pantry-skeleton pantry-detail__skeleton-line pantry-detail__skeleton-line--tags'
        aria-hidden='true'
      />
      <div
        className='pantry-skeleton pantry-detail__skeleton-block pantry-detail__skeleton-block--dates'
        aria-hidden='true'
      />
      <div className='pantry-detail__actions'>
        <div
          className='pantry-skeleton pantry-detail__skeleton-line pantry-detail__skeleton-line--action'
          aria-hidden='true'
        />
        <div
          className='pantry-skeleton pantry-detail__skeleton-line pantry-detail__skeleton-line--action'
          aria-hidden='true'
        />
      </div>
    </div>
  )
}

function RouteComponent() {
  const { detailPromise } = Route.useLoaderData()
  const search = Route.useSearch()
  const router = useRouter()
  const listSearch = buildListBackSearch(search.tags)

  const { newBookmarkCreated, bookmarkUpdated } = useRouterState({
    select: (s) => s.location.state
  })

  return (
    <section
      className='pantry-detail'
      aria-label='ブックマーク詳細'>
      {newBookmarkCreated ? (
        <div
          className='pantry-flash'
          role='alert'>
          ブックマークを登録しました
        </div>
      ) : null}
      {bookmarkUpdated ? (
        <div
          className='pantry-flash'
          role='alert'>
          ブックマークを更新しました
        </div>
      ) : null}

      <ErrorBoundary
        FallbackComponent={DetailError}
        onReset={() => {
          void router.invalidate()
        }}>
        <Suspense fallback={<DetailSkeleton />}>
          <DetailBody
            detailPromise={detailPromise}
            listSearch={listSearch}
          />
        </Suspense>
      </ErrorBoundary>
    </section>
  )
}

function DetailBody({
  detailPromise,
  listSearch
}: {
  readonly detailPromise: ReturnType<typeof loadDetail>
  readonly listSearch: ReturnType<typeof buildListBackSearch>
}) {
  const detail = use(detailPromise)
  const navigate = useNavigate()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, startDeleteTransition] = useTransition()

  if (detail.kind === 'not-found') {
    return (
      <UiEmpty
        title='このブックマークは見つかりません'
        action={
          <Link
            to='/'
            search={listSearch}
            className='pantry-text-link'>
            一覧へ戻る
          </Link>
        }
      />
    )
  }

  const { bookmark, tagNames } = detail

  const handleDelete = () => {
    setDeleteError(null)
    startDeleteTransition(async () => {
      try {
        await deleteBookmark({ data: { id: bookmark.id } })
        await navigate({
          to: '/',
          search: listSearch,
          state: { bookmarkDeleted: true }
        })
      } catch (error) {
        setDeleteError(error instanceof Error ? error.message : '削除に失敗しました')
      }
    })
  }

  return (
    <>
      <nav className='pantry-detail__nav'>
        <Link
          to='/'
          search={listSearch}
          className='pantry-text-link'>
          一覧へ戻る
        </Link>
      </nav>

      <header className='pantry-detail__header'>
        <h1 className='pantry-detail__title'>{bookmark.title}</h1>
        <a
          href={bookmark.url}
          target='_blank'
          rel='noreferrer'
          className='pantry-detail__url'>
          {bookmark.url}
        </a>
      </header>

      {bookmark.note ? <p className='pantry-detail__note'>{bookmark.note}</p> : null}

      {tagNames.length > 0 ? (
        <ul className='pantry-detail__tags'>
          {tagNames.map((name) => (
            <li key={name}>
              <Link
                to='/'
                search={buildListBackSearch([name])}
                className='pantry-tag-chip pantry-tag-chip--link'>
                {name}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className='pantry-detail__meta'>タグなし</p>
      )}

      <dl className='pantry-detail__dates'>
        <div>
          <dt>作成</dt>
          <dd>{formatDateTime(bookmark.createdAt)}</dd>
        </div>
        <div>
          <dt>更新</dt>
          <dd>{formatDateTime(bookmark.updatedAt)}</dd>
        </div>
      </dl>

      <div className='pantry-detail__actions'>
        <Link
          to='/bookmarks/$id/edit'
          params={{ id: bookmark.id }}
          search={listSearch.tags !== undefined ? { tags: listSearch.tags } : {}}
          className='pantry-button pantry-button--accent'>
          編集
        </Link>

        <Dialog.Root
          open={deleteOpen}
          onOpenChange={(open) => {
            setDeleteOpen(open)
            if (!open) {
              setDeleteError(null)
            }
          }}>
          <Dialog.Trigger
            className='pantry-button pantry-button--danger'
            disabled={isDeleting}>
            削除
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop className='pantry-dialog__backdrop' />
            <Dialog.Popup className='pantry-dialog'>
              <Dialog.Title>このブックマークを削除しますか？</Dialog.Title>
              <Dialog.Description>
                「{bookmark.title}」を削除します。一覧からは見えなくなります。
              </Dialog.Description>
              {deleteError ? (
                <p
                  className='pantry-field__error'
                  role='alert'>
                  {deleteError}
                </p>
              ) : null}
              <div className='pantry-dialog__actions'>
                <Dialog.Close
                  className='pantry-button pantry-button--secondary'
                  disabled={isDeleting}>
                  キャンセル
                </Dialog.Close>
                <button
                  type='button'
                  className='pantry-button pantry-button--danger'
                  onClick={handleDelete}
                  disabled={isDeleting}>
                  {isDeleting ? '削除中…' : '削除を確認'}
                </button>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </>
  )
}
