import { Globe } from 'lucide-react'
import { css, cx } from 'styled-system/css'

import { StyledLink } from '../../../shared/components/styled-link'
import { tagChip } from '../../../styles/tag-chip'
import type { BookmarkListItem } from '../lib/attach-bookmark-tags'
import { formatDateTime } from '../lib/format-date-time'
import { shortenUrl } from '../lib/shorten-url'

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
              <StyledLink
                to='/bookmarks/$id'
                params={{ id: bookmark.id }}
                search={detailSearch}
                visual='plain'>
                {bookmark.title}
              </StyledLink>
            </td>
            <td className={tableCell}>
              <StyledLink
                to='/bookmarks/$id'
                params={{ id: bookmark.id }}
                search={detailSearch}
                visual='muted'>
                <Globe
                  size={14}
                  aria-hidden
                />{' '}
                {shortenUrl(bookmark.url, 48)}
              </StyledLink>
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
              <StyledLink
                to='/bookmarks/$id'
                params={{ id: bookmark.id }}
                search={detailSearch}
                visual='muted'>
                {formatDateTime(bookmark.updatedAt)}
              </StyledLink>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
