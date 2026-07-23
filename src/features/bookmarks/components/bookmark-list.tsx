import { getRouteApi, Link, useNavigate, useRouter } from '@tanstack/react-router'
import { ChevronDown, LayoutGrid, List, Plus, Search, X } from 'lucide-react'
import { Suspense, use, useEffect, useId, useState } from 'react'
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'
import { css } from 'styled-system/css'

import { PantryMotion } from '../../../components/pantry-motion'
import { UiEmpty, UiError, UiLoading } from '../../../components/ui-state'
import type { BookmarkSearchSchema } from '../../../routes/_protected/-lib/bookmark-search-schema'
import { button, cx, formControl, srOnly, surface, tagChip } from '../../../styles/ui'
import type { ShelfTag } from '../../tags/tag-shelf'
import { touchTagLastUsed } from '../../tags/tag.function'
import type { BookmarkListItem } from '../attach-bookmark-tags'
import { fetchBookmarks } from '../bookmark.function'
import { readListLayout, writeListLayout } from '../list-layout-preference'
import type { ListLayout } from '../list-layout-preference'
import { shortenUrl } from '../shorten-url'
import { BookmarkTable } from './bookmark-table'

const indexRouteApi = getRouteApi('/_protected/')
const protectedRouteApi = getRouteApi('/_protected')

const toolbar = css({ display: 'flex', flexDirection: 'column', gap: '3.5', marginBlockEnd: '5' })
const titleRow = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3'
})
const title = css({ margin: '0', fontSize: 'lg', fontWeight: 'bold' })
const newLink = css({
  color: 'accent.solid',
  textDecoration: 'none',
  minBlockSize: 'touch',
  display: 'inline-flex',
  alignItems: 'center',
  fontWeight: 'semibold'
})
const searchForm = css({ display: 'flex', gap: '2', flexWrap: 'wrap' })
const searchInput = cx(formControl, css({ flex: '1', minInlineSize: '12rem' }))
const controls = css({
  display: 'flex',
  flexWrap: 'wrap',
  rowGap: '3',
  columnGap: '4',
  alignItems: 'center'
})
const groupFieldset = css({
  display: 'inline-flex',
  gap: '1',
  margin: '0',
  padding: '0',
  borderWidth: 'none',
  minInlineSize: '0'
})
const toggleButton = css({
  minBlockSize: 'touch',
  borderWidth: 'thin',
  borderStyle: 'solid',
  borderColor: 'border.default',
  borderRadius: 'box',
  background: 'bg.surface',
  color: 'fg.default',
  cursor: 'pointer',
  paddingBlock: '2',
  paddingInline: '3',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'semibold',
  _pressed: { borderColor: 'accent.solid', background: 'accent.subtle', color: 'accent.solid' }
})
const sortLabel = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1.5',
  color: 'fg.muted',
  fontSize: 'xs'
})
const sortSelect = cx(
  formControl,
  css({ paddingBlock: '1.5', paddingInline: '2', color: 'fg.default' })
)
const tagsRow = css({ display: 'flex', flexWrap: 'wrap', gap: '2', alignItems: 'center' })
const addTagLabel = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1.5',
  color: 'fg.muted',
  fontSize: 'xs'
})
const addTagSelect = cx(
  formControl,
  css({ paddingBlock: '1.5', paddingInline: '2', color: 'fg.default' })
)
const bookmarkCards = css({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '3',
  margin: '0',
  padding: '0',
  listStyle: 'none',
  sm: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }
})
const bookmarkCard = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5',
  textDecoration: 'none',
  color: 'fg.default',
  minBlockSize: '5.5rem',
  paddingBlock: '4',
  paddingInline: '4.5'
})
const cardTitle = css({ fontWeight: 'bold' })
const cardUrl = css({
  color: 'fg.muted',
  fontSize: 'xs',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
})
const cardNote = css({
  color: 'fg.muted',
  fontSize: 'xs',
  display: '-webkit-box',
  WebkitLineClamp: '2',
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden'
} as never)
const bookmarkTags = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1',
  margin: '0',
  padding: '0',
  listStyle: 'none'
})
const cardTags = cx(bookmarkTags, css({ marginBlockStart: '0.5' }))
const tableSkeleton = css({ display: 'flex', flexDirection: 'column', gap: '2' })
const partialSection = css({ marginBlockStart: '5', display: 'flex', justifyContent: 'center' })
const loadMoreButton = cx(
  button(),
  css({
    borderColor: 'accent.solid',
    color: 'accent.solid',
    fontWeight: 'semibold',
    minInlineSize: '12rem',
    _disabled: { opacity: '0.6', cursor: 'wait' }
  })
)

function ListError({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <UiError
      message={getErrorMessage(error) ?? '一覧の読み込みに失敗しました'}
      onRetry={resetErrorBoundary}
    />
  )
}

function ListLoading({ layout }: { readonly layout: ListLayout }) {
  if (layout === 'card') {
    return (
      <div
        className={bookmarkCards}
        aria-busy='true'>
        <UiLoading label='一覧を読み込み中' />
        <UiLoading label='一覧を読み込み中' />
        <UiLoading label='一覧を読み込み中' />
      </div>
    )
  }

  return (
    <div
      className={tableSkeleton}
      aria-busy='true'>
      <UiLoading label='一覧を読み込み中' />
      <UiLoading label='一覧を読み込み中' />
      <UiLoading label='一覧を読み込み中' />
    </div>
  )
}

function detailSearchFromList(search: BookmarkSearchSchema): { tags?: string[] } {
  if (search.tags !== undefined && search.tags.length > 0) {
    return { tags: search.tags }
  }
  return {}
}

function BookmarkCards({
  bookmarks,
  detailSearch
}: {
  readonly bookmarks: BookmarkListItem[]
  readonly detailSearch: { tags?: string[] }
}) {
  return (
    <ul className={bookmarkCards}>
      {bookmarks.map((bookmark) => (
        <li key={bookmark.id}>
          <Link
            to='/bookmarks/$id'
            params={{ id: bookmark.id }}
            search={detailSearch}
            className={cx(surface, bookmarkCard)}>
            <span className={cardTitle}>{bookmark.title}</span>
            <span className={cardUrl}>{shortenUrl(bookmark.url)}</span>
            {bookmark.note ? <span className={cardNote}>{bookmark.note}</span> : null}
            {bookmark.tags.length > 0 ? (
              <ul className={cardTags}>
                {bookmark.tags.map((tag) => (
                  <li key={tag.id}>
                    <span className={tagChip({ visual: 'label' })}>{tag.name}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  )
}

function shelfTitle(search: BookmarkSearchSchema): string {
  if (search.tags !== undefined && search.tags.length > 0) {
    return search.tags[0] ?? 'すべて'
  }
  return 'すべて'
}

function hasActiveConditions(search: BookmarkSearchSchema): boolean {
  return Boolean(search.q?.trim()) || (search.tags !== undefined && search.tags.length > 0)
}

function resolveSearchPatch<T>(
  clear: boolean | undefined,
  patchValue: T | undefined,
  currentValue: T | undefined
): T | undefined {
  if (clear) {
    return undefined
  }
  if (patchValue !== undefined) {
    return patchValue
  }
  return currentValue
}

function buildListSearch(
  current: BookmarkSearchSchema,
  patch: {
    q?: string | undefined
    tags?: string[] | undefined
    tagMode?: BookmarkSearchSchema['tagMode']
    sort?: BookmarkSearchSchema['sort']
    clearQ?: boolean
    clearTags?: boolean
  }
): BookmarkSearchSchema {
  const next: BookmarkSearchSchema = {
    limit: current.limit,
    offset: 0,
    view: 'list',
    tagMode: patch.tagMode ?? current.tagMode,
    sort: patch.sort ?? current.sort
  }

  const q = resolveSearchPatch(patch.clearQ, patch.q, current.q)
  const tags = resolveSearchPatch(patch.clearTags, patch.tags, current.tags)

  if (q !== undefined && q !== '') {
    next.q = q
  }
  if (tags !== undefined && tags.length > 0) {
    next.tags = tags
  }

  return next
}

function ListToolbar({
  search,
  layout,
  onLayoutChange,
  shelfTags
}: {
  readonly search: BookmarkSearchSchema
  readonly layout: ListLayout
  readonly onLayoutChange: (layout: ListLayout) => void
  readonly shelfTags: ShelfTag[]
}) {
  const navigate = useNavigate({ from: '/' })
  const qInputId = useId()
  const [draftQ, setDraftQ] = useState(search.q ?? '')

  useEffect(() => {
    setDraftQ(search.q ?? '')
  }, [search.q])

  const selectedTags = search.tags ?? []
  const addableTags = shelfTags.filter((tag) => !selectedTags.includes(tag.name))

  const patchSearch = (patch: Parameters<typeof buildListSearch>[1]) => {
    void navigate({
      to: '/',
      search: buildListSearch(search, patch)
    })
  }

  return (
    <div className={toolbar}>
      <div className={titleRow}>
        <h1 className={title}>{shelfTitle(search)}</h1>
        <Link
          to='/bookmarks/new'
          search={detailSearchFromList(search)}
          className={newLink}>
          <Plus
            size={16}
            aria-hidden
          />{' '}
          新規
        </Link>
      </div>

      <form
        className={searchForm}
        onSubmit={(event) => {
          event.preventDefault()
          const nextQ = draftQ.trim()
          if (nextQ === '') {
            patchSearch({ clearQ: true })
            return
          }
          patchSearch({ q: nextQ })
        }}>
        <label
          htmlFor={qInputId}
          className={srOnly}>
          検索
        </label>
        <input
          id={qInputId}
          type='search'
          className={searchInput}
          value={draftQ}
          onChange={(event) => {
            setDraftQ(event.target.value)
          }}
          placeholder='タイトル・URL・メモ'
        />
        <button
          type='submit'
          className={button()}>
          <Search
            size={16}
            aria-hidden
          />{' '}
          検索
        </button>
      </form>

      <div className={controls}>
        <fieldset className={groupFieldset}>
          <legend className={srOnly}>タグ条件</legend>
          <button
            type='button'
            className={toggleButton}
            aria-pressed={search.tagMode === 'and'}
            onClick={() => {
              patchSearch({ tagMode: 'and' })
            }}>
            AND
          </button>
          <button
            type='button'
            className={toggleButton}
            aria-pressed={search.tagMode === 'or'}
            onClick={() => {
              patchSearch({ tagMode: 'or' })
            }}>
            OR
          </button>
        </fieldset>

        <label className={sortLabel}>
          並び
          <select
            className={sortSelect}
            value={search.sort}
            onChange={(event) => {
              const sort = event.target.value === 'updated' ? 'updated' : 'newest'
              patchSearch({ sort })
            }}>
            <option value='newest'>新しい順</option>
            <option value='updated'>更新順</option>
          </select>
        </label>

        <fieldset className={groupFieldset}>
          <legend className={srOnly}>表示切替</legend>
          <button
            type='button'
            className={toggleButton}
            aria-pressed={layout === 'table'}
            onClick={() => {
              onLayoutChange('table')
            }}>
            <List
              size={16}
              aria-hidden
            />{' '}
            テーブル
          </button>
          <button
            type='button'
            className={toggleButton}
            aria-pressed={layout === 'card'}
            onClick={() => {
              onLayoutChange('card')
            }}>
            <LayoutGrid
              size={16}
              aria-hidden
            />{' '}
            カード
          </button>
        </fieldset>
      </div>

      <div className={tagsRow}>
        {selectedTags.map((tagName) => (
          <button
            key={tagName}
            type='button'
            className={tagChip({ visual: 'interactive' })}
            onClick={() => {
              const next = selectedTags.filter((name) => name !== tagName)
              if (next.length === 0) {
                patchSearch({ clearTags: true })
                return
              }
              patchSearch({ tags: next })
            }}>
            {tagName}
            <X
              size={14}
              aria-hidden
            />
            <span className={srOnly}>を外す</span>
          </button>
        ))}

        {addableTags.length > 0 ? (
          <label className={addTagLabel}>
            タグを追加
            <select
              className={addTagSelect}
              value=''
              onChange={(event) => {
                const name = event.target.value
                if (name === '') {
                  return
                }
                patchSearch({ tags: [...selectedTags, name] })
              }}>
              <option value=''>選択…</option>
              {addableTags.map((tag) => (
                <option
                  key={tag.id}
                  value={tag.name}>
                  {tag.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
    </div>
  )
}

function BookmarkListResults({
  bookmarkPromise,
  layout,
  search,
  pageLimit
}: {
  readonly bookmarkPromise: Promise<BookmarkListItem[]>
  readonly layout: ListLayout
  readonly search: BookmarkSearchSchema
  readonly pageLimit: number
}) {
  const initial = use(bookmarkPromise)
  const [items, setItems] = useState(initial)
  const [hasMore, setHasMore] = useState(initial.length >= pageLimit)
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  useEffect(() => {
    setItems(initial)
    setHasMore(initial.length >= pageLimit)
    setLoadMoreError(null)
  }, [initial, pageLimit])

  if (items.length === 0) {
    if (hasActiveConditions(search)) {
      const hasQ = Boolean(search.q?.trim())
      const hasTags = search.tags !== undefined && search.tags.length > 0
      return (
        <UiEmpty
          title='条件に合うブックマークがありません'
          action={
            <Link
              to='/'
              search={buildListSearch(search, {
                clearQ: hasQ,
                clearTags: hasTags
              })}>
              条件をクリア
            </Link>
          }
        />
      )
    }

    return (
      <UiEmpty
        title='この棚はまだ空です'
        action={
          <Link
            to='/bookmarks/new'
            search={detailSearchFromList(search)}>
            新規ブックマーク
          </Link>
        }
      />
    )
  }

  const detailSearch = detailSearchFromList(search)

  const loadMore = () => {
    if (isLoadingMore) {
      return
    }
    setLoadMoreError(null)
    setIsLoadingMore(true)
    void (async () => {
      try {
        const next = await fetchBookmarks({
          data: {
            tagMode: search.tagMode,
            sort: search.sort,
            limit: pageLimit,
            offset: items.length,
            ...(search.q !== undefined ? { q: search.q } : {}),
            ...(search.tags !== undefined ? { tagNames: search.tags } : {})
          }
        })
        setItems((prev) => [...prev, ...next])
        setHasMore(next.length >= pageLimit)
      } catch (error) {
        setLoadMoreError(getErrorMessage(error) ?? '続きの読み込みに失敗しました')
      } finally {
        setIsLoadingMore(false)
      }
    })()
  }

  return (
    <div>
      <PantryMotion
        key={layout}
        kind='crossfade'>
        {layout === 'card' ? (
          <BookmarkCards
            bookmarks={items}
            detailSearch={detailSearch}
          />
        ) : (
          <BookmarkTable
            bookmarks={items}
            detailSearch={detailSearch}
          />
        )}
      </PantryMotion>

      {hasMore ? (
        <div className={partialSection}>
          {loadMoreError != null ? (
            <UiError
              message={loadMoreError}
              onRetry={loadMore}
            />
          ) : (
            <button
              type='button'
              className={loadMoreButton}
              disabled={isLoadingMore}
              onClick={loadMore}>
              <ChevronDown
                size={16}
                aria-hidden
              />{' '}
              {isLoadingMore ? '読み込み中…' : 'さらに読み込む'}
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}

function useListLayout() {
  const [layout, setLayout] = useState<ListLayout>(() => readListLayout())

  const changeLayout = (next: ListLayout) => {
    setLayout(next)
    writeListLayout(next)
  }

  return [layout, changeLayout] as const
}

function useTouchTagLastUsedOnce(
  search: BookmarkSearchSchema,
  shelfTagsPromise: Promise<ShelfTag[]>
) {
  const tagKey = search.tags?.join('\0') ?? ''

  useEffect(() => {
    if (tagKey === '') {
      return
    }

    let cancelled = false

    void (async () => {
      const tags = await shelfTagsPromise
      if (cancelled) {
        return
      }
      const primaryName = tagKey.split('\0')[0]
      const primary = tags.find((tag) => tag.name === primaryName)
      if (primary != null) {
        void touchTagLastUsed({ data: { id: primary.id } })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [tagKey, shelfTagsPromise])
}

function BookmarkListFrame({
  search,
  layout,
  changeLayout,
  shelfTagsPromise,
  bookmarksPromise
}: {
  readonly search: BookmarkSearchSchema
  readonly layout: ListLayout
  readonly changeLayout: (layout: ListLayout) => void
  readonly shelfTagsPromise: Promise<ShelfTag[]>
  readonly bookmarksPromise: Promise<BookmarkListItem[]>
}) {
  const shelfTags = use(shelfTagsPromise)
  const router = useRouter()
  const listKey = [
    search.q ?? '',
    search.tags?.join(',') ?? '',
    search.tagMode,
    search.sort,
    String(search.limit)
  ].join('|')

  return (
    <>
      <ListToolbar
        search={search}
        layout={layout}
        onLayoutChange={changeLayout}
        shelfTags={shelfTags}
      />

      <ErrorBoundary
        FallbackComponent={ListError}
        onReset={() => {
          void router.invalidate()
        }}>
        <Suspense fallback={<ListLoading layout={layout} />}>
          <PantryMotion
            key={listKey}
            kind='crossfade'>
            <BookmarkListResults
              bookmarkPromise={bookmarksPromise}
              layout={layout}
              search={search}
              pageLimit={search.limit}
            />
          </PantryMotion>
        </Suspense>
      </ErrorBoundary>
    </>
  )
}

export function BookmarkList() {
  const search = indexRouteApi.useSearch()
  const { bookmarksPromise } = indexRouteApi.useLoaderData()
  const { shelfTagsPromise } = protectedRouteApi.useLoaderData()
  const [layout, changeLayout] = useListLayout()

  useTouchTagLastUsedOnce(search, shelfTagsPromise)

  if (bookmarksPromise === undefined) {
    return <UiLoading label='一覧を読み込み中' />
  }

  return (
    <section aria-label='ブックマーク一覧'>
      <Suspense
        fallback={
          <>
            <ListToolbar
              search={search}
              layout={layout}
              onLayoutChange={changeLayout}
              shelfTags={[]}
            />
            <ListLoading layout={layout} />
          </>
        }>
        <BookmarkListFrame
          search={search}
          layout={layout}
          changeLayout={changeLayout}
          shelfTagsPromise={shelfTagsPromise}
          bookmarksPromise={bookmarksPromise}
        />
      </Suspense>
    </section>
  )
}
