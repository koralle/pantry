import { Link } from '@tanstack/react-router'
import { Globe } from 'lucide-react'

import { formatDateTime } from '../../../lib/format-date'
import type { BookmarkListItem } from '../attach-bookmark-tags'
import { shortenUrl } from '../shorten-url'

interface BookmarkTableProps {
  readonly bookmarks: BookmarkListItem[]
  readonly detailSearch?: { tags?: string[] }
}

export function BookmarkTable({ bookmarks, detailSearch = {} }: BookmarkTableProps) {
  return (
    <table className='pantry-bookmark-table'>
      <thead>
        <tr>
          <th>タイトル</th>
          <th>URL</th>
          <th>タグ</th>
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
                <Globe
                  size={14}
                  aria-hidden
                />{' '}
                {shortenUrl(bookmark.url, 48)}
              </Link>
            </td>
            <td>
              {bookmark.tags.length > 0 ? (
                <ul className='pantry-bookmark-tags'>
                  {bookmark.tags.map((tag) => (
                    <li key={tag.id}>
                      <span className='pantry-tag-chip pantry-tag-chip--label'>{tag.name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className='pantry-bookmark-tags__empty'>—</span>
              )}
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
