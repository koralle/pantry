import { Link } from '@tanstack/react-router'
import { Pencil, Pin } from 'lucide-react'
import { use } from 'react'

import { UiEmpty } from '../../components/ui-state'
import { tagShelfSearch } from './components/shelf-nav'
import { sortTagsForNav } from './tag-shelf'
import type { ShelfTag } from './tag-shelf'

export function TagTable({ tagPromise }: { readonly tagPromise: Promise<ShelfTag[]> }) {
  const tags = sortTagsForNav(use(tagPromise))

  if (tags.length === 0) {
    return (
      <UiEmpty
        title='まだ箱がありません'
        action={
          <Link
            to='/tags/new'
            className='pantry-text-link'>
            タグを作成
          </Link>
        }
      />
    )
  }

  return (
    <table className='pantry-tag-table'>
      <thead>
        <tr>
          <th scope='col'>色</th>
          <th scope='col'>名前</th>
          <th scope='col'>件数</th>
          <th scope='col'>ピン</th>
          <th scope='col'>
            <span className='pantry-sr-only'>操作</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {tags.map((tag) => (
          <tr key={tag.id}>
            <td>
              <span
                className='pantry-shelf-dot'
                style={tag.color != null ? { backgroundColor: tag.color } : undefined}
                aria-hidden='true'
              />
              <span className='pantry-sr-only'>{tag.color ?? '色なし'}</span>
            </td>
            <td>
              <Link
                to='/'
                search={tagShelfSearch(tag.name)}
                className='pantry-tag-table__name'>
                {tag.name}
              </Link>
            </td>
            <td className='pantry-tag-table__count'>{tag.bookmarkCount}</td>
            <td>
              {tag.pinned ? (
                <span>
                  <Pin
                    size={16}
                    aria-hidden
                  />
                  <span className='pantry-sr-only'>ピン留め中</span>
                </span>
              ) : (
                <span className='pantry-tag-table__muted'>—</span>
              )}
            </td>
            <td>
              <Link
                to='/tags/$id/edit'
                params={{ id: String(tag.id) }}
                className='pantry-text-link'>
                <Pencil
                  size={16}
                  aria-hidden
                />{' '}
                編集
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
