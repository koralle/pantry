import { Link } from '@tanstack/react-router'

import { BookmarkSelectType } from '../../../db/schema/bookmark'
import { formatDateTime } from '../../../lib/format-date'
import { shortenUrl } from '../shorten-url'

interface BookmarkTableProps {
  readonly bookmarks: BookmarkSelectType[]
  readonly detailSearch?: { tags?: string[] }
}

export function BookmarkTable({ bookmarks, detailSearch = {} }: BookmarkTableProps) {
  return (
    <table className='pantry-bookmark-table'>
      <thead>
        <tr>
          <th>タイトル</th>
          <th>URL</th>
          <th>最終更新</th>
        </tr>
      </thead>
      <tbody>
        {bookmarks.map((bookmark) => (
          <tr key={bookmark.id}>
            <td>
              <Link
                to='/bookmarks/$id'
                params={{ id: bookmark.id }}
                search={detailSearch}
                className='pantry-bookmark-row-link'>
                {bookmark.title}
              </Link>
            </td>
            <td>
              <Link
                to='/bookmarks/$id'
                params={{ id: bookmark.id }}
                search={detailSearch}
                className='pantry-bookmark-row-link pantry-bookmark-row-link--muted'>
                {shortenUrl(bookmark.url, 48)}
              </Link>
            </td>
            <td>
              <Link
                to='/bookmarks/$id'
                params={{ id: bookmark.id }}
                search={detailSearch}
                className='pantry-bookmark-row-link pantry-bookmark-row-link--muted'>
                {formatDateTime(bookmark.updatedAt)}
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
