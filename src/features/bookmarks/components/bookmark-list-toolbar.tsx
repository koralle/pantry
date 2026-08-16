import { useNavigate } from '@tanstack/react-router'
import { LayoutGrid, List, X } from 'lucide-react'
import { css, cx } from 'styled-system/css'

import { formControl } from '../../../styles/form'
import { srOnly } from '../../../styles/sr-only'
import { tagChip } from '../../../styles/tag-chip'
import type { BookmarkSearchSchema } from '../../navigation/lib/bookmark-search'
import type { BookmarkSearchPatch } from '../../navigation/lib/bookmark-search-builders'
import { buildListSearch } from '../../navigation/lib/bookmark-search-builders'
import type { ShelfTag } from '../../tags/lib/tag-shelf'
import type { ListLayout } from '../lib/list-layout-preference'

const toolbar = css({ display: 'flex', flexDirection: 'column', gap: '3', marginBlockEnd: '4' })
const controls = css({
  display: 'flex',
  flexWrap: 'wrap',
  rowGap: '2',
  columnGap: '3',
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
  background: 'transparent',
  color: 'fg.muted',
  cursor: 'pointer',
  paddingBlock: '2',
  paddingInline: '3',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'semibold',
  fontSize: 'xs',
  scale: '1',
  transitionProperty: 'scale, background-color, border-color, color',
  transitionDuration: 'hover',
  transitionTimingFunction: 'press',
  '@media (any-hover: hover)': {
    '&:hover:not([aria-pressed="true"])': {
      color: 'fg.default',
      borderColor: 'border.accent'
    }
  },
  _pressed: { borderColor: 'accent.solid', background: 'accent.subtle', color: 'accent.solid' },
  _active: { scale: '0.98' }
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
  css({ paddingBlock: '1.5', paddingInline: '2', color: 'fg.default', minBlockSize: 'touch' })
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

function listHeading(search: BookmarkSearchSchema): string {
  if (search.q !== undefined && search.q.trim() !== '') {
    return `「${search.q.trim()}」の検索結果`
  }
  if (search.tags !== undefined && search.tags.length > 0) {
    return search.tags.join(' / ')
  }
  return 'ブックマーク'
}

export function ListToolbar({
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

  const selectedTags = search.tags ?? []
  const addableTags = shelfTags.filter((tag) => !selectedTags.includes(tag.name))

  const patchSearch = (patch: BookmarkSearchPatch) => {
    void navigate({
      to: '/',
      search: buildListSearch(search, patch)
    })
  }

  return (
    <div className={toolbar}>
      <h1 className={srOnly}>{listHeading(search)}</h1>

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

      {selectedTags.length > 0 || addableTags.length > 0 ? (
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
      ) : null}
    </div>
  )
}
