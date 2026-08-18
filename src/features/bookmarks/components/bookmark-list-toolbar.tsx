import { useNavigate } from '@tanstack/react-router'
import { LayoutGrid, List, X } from 'lucide-react'
import { css } from 'styled-system/css'

import { StyledButton } from '../../../shared/components/styled-button'
import { StyledSelect } from '../../../shared/components/styled-select'
import { srOnly } from '../../../styles/sr-only'
import type { BookmarkSearchSchema } from '../../navigation/lib/bookmark-search'
import type { BookmarkSearchPatch } from '../../navigation/lib/bookmark-search-builders'
import { buildListSearch } from '../../navigation/lib/bookmark-search-builders'
import { tagNamesMatch } from '../../tags/domain/tag-values'
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
const tagsRow = css({ display: 'flex', flexWrap: 'wrap', gap: '2', alignItems: 'center' })

function listHeading(search: BookmarkSearchSchema, shelfTags: ShelfTag[]): string {
  if (search.q !== undefined && search.q.trim() !== '') {
    return `「${search.q.trim()}」の検索結果`
  }
  if (search.tags !== undefined && search.tags.length > 0) {
    return search.tags.map((tag) => displayTagName(tag, shelfTags)).join(' / ')
  }
  return 'ブックマーク'
}

function displayTagName(searchKey: string, shelfTags: ShelfTag[]): string {
  return shelfTags.find((tag) => tagNamesMatch(tag.name, searchKey))?.name ?? searchKey
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
  const addableTags = shelfTags.filter(
    (tag) => !selectedTags.some((selected) => tagNamesMatch(selected, tag.name))
  )

  const patchSearch = (patch: BookmarkSearchPatch) => {
    void navigate({
      to: '/',
      search: buildListSearch(search, patch)
    })
  }

  return (
    <div className={toolbar}>
      <h1 className={srOnly}>{listHeading(search, shelfTags)}</h1>

      <div className={controls}>
        <fieldset className={groupFieldset}>
          <legend className={srOnly}>タグ条件</legend>
          <StyledButton
            visual='toggle'
            aria-pressed={search.tagMode === 'and'}
            onPress={() => {
              patchSearch({ tagMode: 'and' })
            }}>
            AND
          </StyledButton>
          <StyledButton
            visual='toggle'
            aria-pressed={search.tagMode === 'or'}
            onPress={() => {
              patchSearch({ tagMode: 'or' })
            }}>
            OR
          </StyledButton>
        </fieldset>

        <StyledSelect
          label='並び'
          selectedKey={search.sort}
          onSelectionChange={(key) => {
            if (key === 'newest' || key === 'updated') {
              patchSearch({ sort: key })
            }
          }}>
          <StyledSelect.Item id='newest'>新しい順</StyledSelect.Item>
          <StyledSelect.Item id='updated'>更新順</StyledSelect.Item>
        </StyledSelect>

        <fieldset className={groupFieldset}>
          <legend className={srOnly}>表示切替</legend>
          <StyledButton
            visual='toggle'
            aria-pressed={layout === 'table'}
            onPress={() => {
              onLayoutChange('table')
            }}>
            <List
              size={16}
              aria-hidden
            />{' '}
            テーブル
          </StyledButton>
          <StyledButton
            visual='toggle'
            aria-pressed={layout === 'card'}
            onPress={() => {
              onLayoutChange('card')
            }}>
            <LayoutGrid
              size={16}
              aria-hidden
            />{' '}
            カード
          </StyledButton>
        </fieldset>
      </div>

      {selectedTags.length > 0 || addableTags.length > 0 ? (
        <div className={tagsRow}>
          {selectedTags.map((tagName) => (
            <StyledButton
              key={tagName}
              visual='chip'
              aria-label={`${displayTagName(tagName, shelfTags)}を外す`}
              onPress={() => {
                const next = selectedTags.filter((name) => name !== tagName)
                if (next.length === 0) {
                  patchSearch({ clearTags: true })
                  return
                }
                patchSearch({ tags: next })
              }}>
              {displayTagName(tagName, shelfTags)}
              <X
                size={14}
                aria-hidden
              />
            </StyledButton>
          ))}

          {addableTags.length > 0 ? (
            <StyledSelect.Filterable
              label='タグを追加'
              placeholder='選択…'
              searchPlaceholder='タグを検索'
              selectedKey={null}
              onSelectionChange={(key) => {
                if (typeof key !== 'string' || key === '') {
                  return
                }
                patchSearch({ tags: [...selectedTags, key] })
              }}>
              {addableTags.map((tag) => (
                <StyledSelect.Item
                  key={tag.id}
                  id={tag.name}>
                  {tag.name}
                </StyledSelect.Item>
              ))}
            </StyledSelect.Filterable>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
