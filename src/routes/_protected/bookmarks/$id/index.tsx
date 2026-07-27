import { Dialog } from '@base-ui/react/dialog'
import {
  createFileRoute,
  Link,
  useNavigate,
  useRouter,
  useRouterState
} from '@tanstack/react-router'
import { ArrowLeft, CircleCheck, ExternalLink, Pencil, Trash2, X } from 'lucide-react'
import { Suspense, use, useState, useTransition } from 'react'
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'
import { css } from 'styled-system/css'
import * as v from 'valibot'

import { buildListBackSearch } from '../-lib/list-back-search'
import { UiEmpty, UiError } from '../../../../components/ui-state'
import { deleteBookmark, getBookmark } from '../../../../features/bookmarks/bookmark.function'
import { fetchTags } from '../../../../features/tags/tag.function'
import { formatDateTime } from '../../../../lib/format-date'
import { StyledLink } from '../../../../shared/components/styled-link'
import {
  button,
  cx,
  dialog,
  dialogActions,
  dialogBackdrop,
  dialogTitle,
  fieldError,
  flash,
  skeleton,
  srOnly,
  tagChip,
  workbenchNav,
  workbenchTitle
} from '../../../../styles/ui'

const detailLayout = css({
  maxInlineSize: '42rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '6'
})
const detailHeader = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  paddingBlockStart: '2',
  paddingBlockEnd: '1'
})
const detailUrl = css({ color: 'accent.solid', wordBreak: 'break-all', lineHeight: 'body' })
const detailNote = css({
  margin: '0',
  color: 'fg.default',
  lineHeight: 'relaxed',
  whiteSpace: 'pre-wrap'
})
const detailTags = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
  margin: '0',
  padding: '0',
  listStyle: 'none'
})
const detailMeta = css({ margin: '0', color: 'fg.muted' })
const detailDates = css({ display: 'grid', gap: '3', margin: '0' })
const detailDatesGroup = css({ display: 'grid', gap: '1' })
const detailDatesDt = css({ color: 'fg.muted', fontSize: 'xs2' })
const detailDatesDd = css({ margin: '0', fontVariantNumeric: 'tabular-nums' })

const skeletonReset = css({ padding: '0', borderWidth: 'none' })
const skeletonBlockNote = cx(skeleton, skeletonReset, css({ minBlockSize: '5.5rem' }))
const skeletonBlockDates = cx(skeleton, skeletonReset, css({ minBlockSize: '4.5rem' }))
const skeletonLineNav = cx(skeleton, skeletonReset, css({ minBlockSize: '4', inlineSize: '22' }))
const skeletonLineTitle = cx(
  skeleton,
  skeletonReset,
  css({ minBlockSize: '8', inlineSize: 'min-22' })
)
const skeletonLineUrl = cx(
  skeleton,
  skeletonReset,
  css({ minBlockSize: '4', inlineSize: 'min-18' })
)
const skeletonLineTags = cx(
  skeleton,
  skeletonReset,
  css({ minBlockSize: '7', inlineSize: 'min-12' })
)
const skeletonLineAction = cx(
  skeleton,
  skeletonReset,
  css({ minBlockSize: '11', inlineSize: '22' })
)

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
      className={detailLayout}
      aria-busy='true'>
      <span className={srOnly}>詳細を読み込み中</span>
      <div className={workbenchNav}>
        <div
          className={skeletonLineNav}
          aria-hidden='true'
        />
      </div>
      <header className={detailHeader}>
        <div
          className={skeletonLineTitle}
          aria-hidden='true'
        />
        <div
          className={skeletonLineUrl}
          aria-hidden='true'
        />
      </header>
      <div
        className={skeletonBlockNote}
        aria-hidden='true'
      />
      <div
        className={skeletonLineTags}
        aria-hidden='true'
      />
      <div
        className={skeletonBlockDates}
        aria-hidden='true'
      />
      <div className={dialogActions}>
        <div
          className={skeletonLineAction}
          aria-hidden='true'
        />
        <div
          className={skeletonLineAction}
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
      className={detailLayout}
      aria-label='ブックマーク詳細'>
      {newBookmarkCreated ? (
        <div
          className={flash}
          role='alert'>
          <CircleCheck
            size={16}
            aria-hidden
          />{' '}
          ブックマークを登録しました
        </div>
      ) : null}
      {bookmarkUpdated ? (
        <div
          className={flash}
          role='alert'>
          <CircleCheck
            size={16}
            aria-hidden
          />{' '}
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
          <StyledLink
            to='/'
            search={listSearch}
            visual='accent'>
            一覧へ戻る
          </StyledLink>
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
      <nav className={workbenchNav}>
        <StyledLink
          to='/'
          search={listSearch}
          visual='accent'>
          <ArrowLeft
            size={16}
            aria-hidden
          />{' '}
          一覧へ戻る
        </StyledLink>
      </nav>

      <header className={detailHeader}>
        <h1 className={workbenchTitle}>{bookmark.title}</h1>
        <a
          href={bookmark.url}
          target='_blank'
          rel='noreferrer'
          className={detailUrl}>
          {bookmark.url}{' '}
          <ExternalLink
            size={14}
            aria-hidden
          />
        </a>
      </header>

      {bookmark.note ? <p className={detailNote}>{bookmark.note}</p> : null}

      {tagNames.length > 0 ? (
        <ul className={detailTags}>
          {tagNames.map((name) => (
            <li key={name}>
              <Link
                to='/'
                search={buildListBackSearch([name])}
                className={tagChip({ visual: 'link' })}>
                {name}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className={detailMeta}>タグなし</p>
      )}

      <dl className={detailDates}>
        <div className={detailDatesGroup}>
          <dt className={detailDatesDt}>作成</dt>
          <dd className={detailDatesDd}>{formatDateTime(bookmark.createdAt)}</dd>
        </div>
        <div className={detailDatesGroup}>
          <dt className={detailDatesDt}>更新</dt>
          <dd className={detailDatesDd}>{formatDateTime(bookmark.updatedAt)}</dd>
        </div>
      </dl>

      <div className={dialogActions}>
        <Link
          to='/bookmarks/$id/edit'
          params={{ id: bookmark.id }}
          search={listSearch.tags !== undefined ? { tags: listSearch.tags } : {}}
          className={button({ visual: 'accent' })}>
          <Pencil
            size={16}
            aria-hidden
          />{' '}
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
            className={button({ visual: 'danger' })}
            disabled={isDeleting}>
            <Trash2
              size={16}
              aria-hidden
            />{' '}
            削除
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop className={dialogBackdrop} />
            <Dialog.Popup className={dialog}>
              <Dialog.Title className={dialogTitle}>このブックマークを削除しますか？</Dialog.Title>
              <Dialog.Description>
                「{bookmark.title}」を削除します。一覧からは見えなくなります。
              </Dialog.Description>
              {deleteError ? (
                <p
                  className={fieldError}
                  role='alert'>
                  {deleteError}
                </p>
              ) : null}
              <div className={dialogActions}>
                <Dialog.Close
                  className={button()}
                  disabled={isDeleting}>
                  <X
                    size={16}
                    aria-hidden
                  />{' '}
                  キャンセル
                </Dialog.Close>
                <button
                  type='button'
                  className={button({ visual: 'danger' })}
                  onClick={handleDelete}
                  disabled={isDeleting}>
                  <Trash2
                    size={16}
                    aria-hidden
                  />{' '}
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
