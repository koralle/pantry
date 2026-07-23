import { Link } from '@tanstack/react-router'
import { Globe } from 'lucide-react'
import { css, cx } from 'styled-system/css'

import { formatDateTime } from '../../../lib/format-date'
import { tagChip } from '../../../styles/ui'
import type { BookmarkListItem } from '../attach-bookmark-tags'
import { shortenUrl } from '../shorten-url'

const table = css({ width: 'full', borderCollapse: 'collapse' })
const tableCell = css({
  borderBlockEndWidth: 'thin',
  borderBlockEndStyle: 'solid',
  borderBlockEndColor: 'border.default',
  paddingBlock: '3',
  paddingInline: '2',
  textAlign: 'start',
  verticalAlign: 'top'
})
const tableHeader = css({ color: 'fg.muted', fontSize: 'xs2', fontWeight: 'semibold' })
const rowLink = css({
  color: 'fg.default',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  minBlockSize: 'touch'
})
const rowLinkMuted = css({ color: 'fg.muted', fontSize: 'xs' })
const bookmarkTags = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1',
  margin: '0',
  padding: '0',
  listStyle: 'none'
})
const tagsEmpty = css({ color: 'fg.muted', fontSize: 'xs' })

interface BookmarkTableProps {
  readonly bookmarks: BookmarkListItem[]
  readonly detailSearch?: { tags?: string[] }
}

export function BookmarkTable({ bookmarks, detailSearch = {} }: BookmarkTableProps) {
  return (
    <table className={table}>
      <thead>
        <tr>
          <th className={cx(tableCell, tableHeader)}>タイトル</th>
          <th className={cx(tableCell, tableHeader)}>URL</th>
          <th className={cx(tableCell, tableHeader)}>タグ</th>
          <th className={cx(tableCell, tableHeader)}>最終更新</th>
        </tr>
      </thead>
      <tbody>
        {bookmarks.map((bookmark) => (
          <tr key={bookmark.id}>
            <td className={tableCell}>
              <Link
                to='/bookmarks/$id'
                params={{ id: bookmark.id }}
                search={detailSearch}
                className={rowLink}>
                {bookmark.title}
              </Link>
            </td>
            <td className={tableCell}>
              <Link
                to='/bookmarks/$id'
                params={{ id: bookmark.id }}
                search={detailSearch}
                className={cx(rowLink, rowLinkMuted)}>
                <Globe
                  size={14}
                  aria-hidden
                />{' '}
                {shortenUrl(bookmark.url, 48)}
              </Link>
            </td>
            <td className={tableCell}>
              {bookmark.tags.length > 0 ? (
                <ul className={bookmarkTags}>
                  {bookmark.tags.map((tag) => (
                    <li key={tag.id}>
                      <span className={tagChip({ visual: 'label' })}>{tag.name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className={tagsEmpty}>—</span>
              )}
            </td>
            <td className={tableCell}>
              <Link
                to='/bookmarks/$id'
                params={{ id: bookmark.id }}
                search={detailSearch}
                className={cx(rowLink, rowLinkMuted)}>
                {formatDateTime(bookmark.updatedAt)}
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
