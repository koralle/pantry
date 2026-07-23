import { Link } from '@tanstack/react-router'
import { use } from 'react'
import { css, cx } from 'styled-system/css'

import type { BookmarkSearchSchema } from '../../../routes/_protected/-lib/bookmark-search-schema'
import { sortTagsForNav } from '../tag-shelf'
import type { ShelfTag } from '../tag-shelf'

const listDefaults = {
  limit: 50,
  offset: 0,
  view: 'list' as const,
  tagMode: 'and' as const,
  sort: 'newest' as const
}

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

const shelfItemCount = css({
  color: 'fg.muted',
  fontSize: 'xs',
  fontVariantNumeric: 'tabular-nums'
})

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

export function allShelfSearch(): BookmarkSearchSchema {
  return { ...listDefaults }
}

export function tagShelfSearch(tagName: string): BookmarkSearchSchema {
  return { ...listDefaults, tags: [tagName] }
}

export type ShelfNavSelection = {
  view?: BookmarkSearchSchema['view'] | undefined
  tags?: BookmarkSearchSchema['tags'] | undefined
}

type ShelfNavProps = {
  readonly tags: ShelfTag[]
  readonly selection: ShelfNavSelection
  readonly onNavigate?: (() => void) | undefined
}

export function ShelfNav({ tags, selection, onNavigate }: ShelfNavProps) {
  const sorted = sortTagsForNav(tags)
  const selectedTag = selection.view === 'list' ? selection.tags?.[0] : undefined
  const allSelected =
    selection.view === 'list' && (selection.tags === undefined || selection.tags.length === 0)

  return (
    <nav
      className={shelfNav}
      aria-label='棚'>
      <Link
        to='/'
        search={allShelfSearch()}
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
            search={tagShelfSearch(tag.name)}
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

type ShelfNavAsyncProps = {
  readonly shelfTagsPromise: Promise<ShelfTag[]>
  readonly selection: ShelfNavSelection
  readonly onNavigate?: (() => void) | undefined
}

export function ShelfNavAsync({ shelfTagsPromise, selection, onNavigate }: ShelfNavAsyncProps) {
  const tags = use(shelfTagsPromise)
  return (
    <ShelfNav
      tags={tags}
      selection={selection}
      onNavigate={onNavigate}
    />
  )
}
