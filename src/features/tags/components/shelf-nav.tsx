import { Link } from '@tanstack/react-router'
import { css, cx } from 'styled-system/css'

import { metaCount } from '../../../styles/type'
import type { BookmarkSearchSchema } from '../../navigation/lib/bookmark-search'
import { allShelfSearch, tagShelfSearch } from '../../navigation/lib/bookmark-search-builders'
import { sortTagsForNav } from '../lib/tag-shelf'
import type { ShelfTag } from '../lib/tag-shelf'

const shelfNav = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5'
})

const shelfItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  minBlockSize: 'touch',
  paddingBlock: '2.5',
  paddingInline: '3.5',
  borderInlineStartWidth: 'thick',
  borderInlineStartStyle: 'solid',
  borderInlineStartColor: 'transparent',
  color: 'fg.default',
  textDecoration: 'none',
  borderRadius: 'box',
  transitionProperty: 'background-color, border-color',
  transitionDuration: 'hover',
  transitionTimingFunction: 'press',
  '@media (any-hover: hover)': {
    '&:hover:not([data-selected="true"])': {
      background: 'accent.hover'
    }
  },
  '&[data-selected="true"]': {
    borderInlineStartColor: 'accent.solid',
    background: 'accent.subtle'
  }
})

const shelfItemLabel = css({
  flex: '1',
  minInlineSize: '0',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontWeight: 'semibold'
})

const shelfItemCount = metaCount

const shelfDot = css({
  inlineSize: '2.5',
  blockSize: '2.5',
  borderRadius: 'full',
  background: 'border.default',
  flexShrink: '0'
})

const shelfDotNeutral = css({
  background: 'fg.muted'
})

export type ShelfNavSelection = {
  listActive: boolean
  tags?: BookmarkSearchSchema['tags'] | undefined
}

type ShelfNavProps = {
  readonly tags: ShelfTag[]
  readonly selection: ShelfNavSelection
  readonly listSearch: BookmarkSearchSchema | undefined
  readonly onNavigate?: (() => void) | undefined
}

export function ShelfNav({ tags, selection, listSearch, onNavigate }: ShelfNavProps) {
  const sorted = sortTagsForNav(tags)
  const selectedTag = selection.listActive ? selection.tags?.[0] : undefined
  const allSelected =
    selection.listActive && (selection.tags === undefined || selection.tags.length === 0)

  return (
    <nav
      className={shelfNav}
      aria-label='タグ'>
      <Link
        to='/'
        search={allShelfSearch(listSearch)}
        className={shelfItem}
        data-selected={allSelected ? 'true' : 'false'}
        onClick={onNavigate}>
        <span
          className={cx(shelfDot, shelfDotNeutral)}
          aria-hidden='true'
        />
        <span className={shelfItemLabel}>すべて</span>
      </Link>

      {sorted.map((tag) => {
        const selected = selectedTag === tag.name

        return (
          <Link
            key={tag.id}
            to='/'
            search={tagShelfSearch(tag.name, listSearch)}
            className={shelfItem}
            data-selected={selected ? 'true' : 'false'}
            onClick={onNavigate}>
            <span
              className={shelfDot}
              style={tag.color != null ? { backgroundColor: tag.color } : undefined}
              aria-hidden='true'
            />
            <span className={shelfItemLabel}>{tag.name}</span>
            <span className={shelfItemCount}>{tag.bookmarkCount}</span>
          </Link>
        )
      })}
    </nav>
  )
}
