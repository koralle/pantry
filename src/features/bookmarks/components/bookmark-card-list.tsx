import { Link } from '@tanstack/react-router'
import { css, cx } from 'styled-system/css'

import { interactiveSurface, surface } from '../../../styles/surface'
import { tagChip } from '../../../styles/tag-chip'
import type { BookmarkListItem } from '../lib/attach-bookmark-tags'
import { shortenUrl } from '../lib/shorten-url'

export const bookmarkCards = css({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '4',
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

export function BookmarkCardList({
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
            className={cx(surface, interactiveSurface, bookmarkCard)}>
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
