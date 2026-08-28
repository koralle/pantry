import { Link } from '@tanstack/react-router'
import { css, cx } from 'styled-system/css'

import { interactiveSurface, surface } from '../../../styles/surface'
import { tagChip } from '../../../styles/tag-chip'
import type { BookmarkDetailSearch } from '../../navigation/lib/bookmark-search'
import { shortenUrl } from '../lib/shorten-url'
import type { BookmarkListItem } from '../persistence/list-bookmarks'

export const bookmarkCards = css({
  display: 'grid',
  alignItems: 'stretch',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: '4',
  margin: '0',
  padding: '0',
  listStyle: 'none',
  sm: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }
})
const cardItem = css({
  display: 'flex',
  minInlineSize: '0',
  blockSize: 'full'
})
const bookmarkCard = css({
  display: 'flex',
  flexDirection: 'column',
  flex: '1',
  gap: '1.5',
  textDecoration: 'none',
  color: 'fg.default',
  minBlockSize: '5.5rem',
  minInlineSize: '0',
  inlineSize: 'full',
  paddingBlock: '4',
  paddingInline: '4.5',
  _focusVisible: {
    outlineWidth: 'medium',
    outlineStyle: 'solid',
    outlineColor: 'accent.solid',
    outlineOffset: '-2px'
  }
})
const cardTitle = css({
  fontWeight: 'bold',
  minInlineSize: '0',
  overflowWrap: 'anywhere'
})
const cardUrl = css({
  color: 'fg.muted',
  fontSize: 'xs',
  minInlineSize: '0',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
})
const cardNote = css({
  color: 'fg.muted',
  fontSize: 'xs',
  minInlineSize: '0',
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
const cardTags = cx(bookmarkTags, css({ marginBlockStart: 'auto' }))

export function BookmarkCardList({
  bookmarks,
  detailSearch
}: {
  readonly bookmarks: BookmarkListItem[]
  readonly detailSearch: BookmarkDetailSearch
}) {
  return (
    <ul className={bookmarkCards}>
      {bookmarks.map((bookmark) => (
        <li
          key={bookmark.id}
          className={cardItem}>
          <Link
            to='/bookmarks/$id'
            params={{ id: bookmark.id }}
            search={detailSearch}
            className={cx(surface, interactiveSurface, bookmarkCard)}>
            <span className={cardTitle}>{bookmark.title}</span>
            <span className={cardUrl}>{shortenUrl(bookmark.url)}</span>
            {bookmark.note ? <span className={cardNote}>{bookmark.note}</span> : null}
            {bookmark.tags.length > 0 ? (
              <div className={cardTags}>
                {bookmark.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className={tagChip({ visual: 'label' })}>
                    {tag.name}
                  </span>
                ))}
              </div>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  )
}
