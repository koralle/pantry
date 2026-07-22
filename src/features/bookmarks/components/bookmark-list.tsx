import { getRouteApi, Link, useNavigate, useRouter } from '@tanstack/react-router'
import { ChevronDown, LayoutGrid, List, Plus, Search, X } from 'lucide-react'
import { Suspense, use, useEffect, useId, useState } from 'react'
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'

import { PantryMotion } from '../../../components/pantry-motion'
import { UiEmpty, UiError, UiLoading } from '../../../components/ui-state'
import type { BookmarkSearchSchema } from '../../../routes/_protected/-lib/bookmark-search-schema'
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
        className='pantry-bookmark-cards'
        aria-busy='true'>
        <UiLoading label='一覧を読み込み中' />
        <UiLoading label='一覧を読み込み中' />
        <UiLoading label='一覧を読み込み中' />
      </div>
    )
  }

  return (
    <div
      className='pantry-bookmark-table-skeleton'
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
    <ul className='pantry-bookmark-cards'>
      {bookmarks.map((bookmark) => (
        <li key={bookmark.id}>
          <Link
            to='/bookmarks/$id'
            params={{ id: bookmark.id }}
            search={detailSearch}
            className='pantry-box pantry-bookmark-card'>
            <span className='pantry-bookmark-card__title'>{bookmark.title}</span>
            <span className='pantry-bookmark-card__url'>{shortenUrl(bookmark.url)}</span>
            {bookmark.note ? (
              <span className='pantry-bookmark-card__note'>{bookmark.note}</span>
            ) : null}
            {bookmark.tags.length > 0 ? (
              <ul className='pantry-bookmark-tags'>
                {bookmark.tags.map((tag) => (
                  <li key={tag.id}>
                    <span className='pantry-tag-chip pantry-tag-chip--label'>{tag.name}</span>
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
    <div className='pantry-list-toolbar'>
      <div className='pantry-list-toolbar__title-row'>
        <h1 className='pantry-list-toolbar__title'>{shelfTitle(search)}</h1>
        <Link
          to='/bookmarks/new'
          search={detailSearchFromList(search)}
          className='pantry-list-toolbar__new'>
          <Plus
            size={16}
            aria-hidden
          />{' '}
          新規
        </Link>
      </div>

      <form
        className='pantry-list-toolbar__search'
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
          className='pantry-sr-only'>
          検索
        </label>
        <input
          id={qInputId}
          type='search'
          value={draftQ}
          onChange={(event) => {
            setDraftQ(event.target.value)
          }}
          placeholder='タイトル・URL・メモ'
        />
        <button type='submit'>
          <Search
            size={16}
            aria-hidden
          />{' '}
          検索
        </button>
      </form>

      <div className='pantry-list-toolbar__controls'>
        <fieldset className='pantry-list-toolbar__group'>
          <legend className='pantry-sr-only'>タグ条件</legend>
          <button
            type='button'
            aria-pressed={search.tagMode === 'and'}
            onClick={() => {
              patchSearch({ tagMode: 'and' })
            }}>
            AND
          </button>
          <button
            type='button'
            aria-pressed={search.tagMode === 'or'}
            onClick={() => {
              patchSearch({ tagMode: 'or' })
            }}>
            OR
          </button>
        </fieldset>

        <label className='pantry-list-toolbar__sort'>
          並び
          <select
            value={search.sort}
            onChange={(event) => {
              const sort = event.target.value === 'updated' ? 'updated' : 'newest'
              patchSearch({ sort })
            }}>
            <option value='newest'>新しい順</option>
            <option value='updated'>更新順</option>
          </select>
        </label>

        <fieldset className='pantry-list-toolbar__group'>
          <legend className='pantry-sr-only'>表示切替</legend>
          <button
            type='button'
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

      <div className='pantry-list-toolbar__tags'>
        {selectedTags.map((tagName) => (
          <button
            key={tagName}
            type='button'
            className='pantry-tag-chip'
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
            <span className='pantry-sr-only'>を外す</span>
          </button>
        ))}

        {addableTags.length > 0 ? (
          <label className='pantry-list-toolbar__add-tag'>
            タグを追加
            <select
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
    <div className='pantry-bookmark-list__results'>
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
        <div className='pantry-bookmark-list__partial'>
          {loadMoreError != null ? (
            <UiError
              message={loadMoreError}
              onRetry={loadMore}
            />
          ) : (
            <button
              type='button'
              className='pantry-load-more'
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
    <section
      className='pantry-bookmark-list'
      aria-label='ブックマーク一覧'>
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
