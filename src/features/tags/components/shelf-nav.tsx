import { Link } from '@tanstack/react-router'
import { use } from 'react'

import type { BookmarkSearchSchema } from '../../../routes/_protected/-lib/bookmark-search-schema'
import { sortTagsForNav } from '../tag-shelf';
import type { ShelfTag } from '../tag-shelf';

const listDefaults = {
  limit: 50,
  offset: 0,
  view: 'list' as const,
  tagMode: 'and' as const,
  sort: 'newest' as const
}

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
      className='pantry-shelf-nav'
      aria-label='棚'>
      <Link
        to='/'
        search={allShelfSearch()}
        className='pantry-shelf-item'
        data-selected={allSelected ? 'true' : 'false'}
        onClick={onNavigate}>
        <span
          className='pantry-shelf-dot pantry-shelf-dot--neutral'
          aria-hidden='true'
        />
        <span className='pantry-shelf-item__label'>すべて</span>
      </Link>

      {sorted.map((tag) => {
        const selected = selectedTag === tag.name

        return (
          <Link
            key={tag.id}
            to='/'
            search={tagShelfSearch(tag.name)}
            className='pantry-shelf-item'
            data-selected={selected ? 'true' : 'false'}
            onClick={onNavigate}>
            <span
              className='pantry-shelf-dot'
              style={tag.color != null ? { backgroundColor: tag.color } : undefined}
              aria-hidden='true'
            />
            <span className='pantry-shelf-item__label'>{tag.name}</span>
            <span className='pantry-shelf-item__count'>{tag.bookmarkCount}</span>
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
