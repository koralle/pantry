import { Link } from '@tanstack/react-router'
import { css, cx } from 'styled-system/css'

import {
  dataTable,
  dataTableCell,
  dataTableHeadCell,
  dataTableRow,
  dataTableRowLink,
  dataTableWrap
} from '../../../styles/data-table'
import { srOnly } from '../../../styles/sr-only'
import { tagChip } from '../../../styles/tag-chip'
import type { BookmarkDetailSearch } from '../../navigation/lib/bookmark-search-builders'
import { formatListDateTime } from '../lib/format-date-time'
import { shortenUrl } from '../lib/shorten-url'
import type { BookmarkListItem } from '../persistence/list-bookmarks'

const bookmarkTags = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1',
  margin: '0',
  padding: '0',
  listStyle: 'none'
})
const tagsEmpty = css({ color: 'fg.muted', fontSize: 'xs' })
const titleStack = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5',
  minInlineSize: '0',
  overflowWrap: 'anywhere'
})
const urlMeta = css({
  color: 'fg.muted',
  fontSize: '2xs',
  minInlineSize: '0',
  maxInlineSize: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
})
const titleCell = css({
  minInlineSize: '0',
  width: '50%'
})
const tagsCell = css({
  minInlineSize: '0',
  width: '30%'
})
const dateCell = css({
  color: 'fg.muted',
  fontSize: 'xs',
  fontVariantNumeric: 'tabular-nums',
  minInlineSize: '0',
  overflowWrap: 'anywhere',
  whiteSpace: 'normal',
  width: '20%'
})

const EMPTY_DETAIL_SEARCH: BookmarkDetailSearch = {}

interface BookmarkTableProps {
  readonly bookmarks: BookmarkListItem[]
  readonly detailSearch?: BookmarkDetailSearch
}

export function BookmarkTable({
  bookmarks,
  detailSearch = EMPTY_DETAIL_SEARCH
}: BookmarkTableProps) {
  return (
    <div className={dataTableWrap}>
      <table className={dataTable}>
        <caption className={srOnly}>ブックマーク</caption>
        <thead>
          <tr>
            <th
              scope='col'
              className={cx(dataTableCell, dataTableHeadCell, titleCell)}>
              タイトル
            </th>
            <th
              scope='col'
              className={cx(dataTableCell, dataTableHeadCell, tagsCell)}>
              タグ
            </th>
            <th
              scope='col'
              className={cx(dataTableCell, dataTableHeadCell, dateCell)}>
              最終更新
            </th>
          </tr>
        </thead>
        <tbody>
          {bookmarks.map((bookmark) => (
            <tr
              key={bookmark.id}
              className={dataTableRow}>
              <td className={cx(dataTableCell, titleCell)}>
                <div className={titleStack}>
                  <Link
                    to='/bookmarks/$id'
                    params={{ id: bookmark.id }}
                    search={detailSearch}
                    aria-label={bookmark.title}
                    className={dataTableRowLink}>
                    {bookmark.title}
                  </Link>
                  <span className={urlMeta}>{shortenUrl(bookmark.url, 48)}</span>
                </div>
              </td>
              <td className={cx(dataTableCell, tagsCell)}>
                {bookmark.tags.length > 0 ? (
                  <ul className={bookmarkTags}>
                    {bookmark.tags.map((tag) => (
                      <li key={tag.id}>
                        <span className={tagChip({ visual: 'label' })}>{tag.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className={tagsEmpty}>-</span>
                )}
              </td>
              <td className={cx(dataTableCell, dateCell)}>
                {formatListDateTime(bookmark.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
