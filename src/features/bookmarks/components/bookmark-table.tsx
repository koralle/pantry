import { Link } from '@tanstack/react-router'

import { BookmarkSelectType } from '../../../db/schema/bookmark'
import { formatDateTime } from '../../../lib/format-date'

interface BookmarkTableProps {
  readonly bookmarks: BookmarkSelectType[]
}

function shortenUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname === '/' ? '' : parsed.pathname
    const display = `${parsed.host}${path}`
    return display.length > 48 ? `${display.slice(0, 47)}…` : display
  } catch {
    return url.length > 48 ? `${url.slice(0, 47)}…` : url
  }
}

export function BookmarkTable({ bookmarks }: BookmarkTableProps) {
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
                className='pantry-bookmark-row-link'>
                {bookmark.title}
              </Link>
            </td>
            <td>
              <Link
                to='/bookmarks/$id'
                params={{ id: bookmark.id }}
                className='pantry-bookmark-row-link pantry-bookmark-row-link--muted'>
                {shortenUrl(bookmark.url)}
              </Link>
            </td>
            <td>
              <Link
                to='/bookmarks/$id'
                params={{ id: bookmark.id }}
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
