import { Link } from '@tanstack/react-router'
import { use } from 'react'

import { TagSelectType } from '../../db/schema/tag'
import { formatDateTime } from '../../lib/format-date'

export function TagTable({ tagPromise }: { readonly tagPromise: Promise<TagSelectType[]> }) {
  const tags = use(tagPromise)

  return (
    <table>
      <thead>
        <tr>
          <th>id</th>
          <th>名前</th>
          <th>最終更新日</th>
        </tr>
      </thead>
      <tbody>
        {tags.map((tag) => (
          <tr key={tag.id}>
            <td>
              <Link
                to='/tags/$id'
                params={{ id: tag.id.toString() }}>
                {tag.id}
              </Link>
            </td>
            <td>{tag.name}</td>
            <td>{formatDateTime(tag.updatedAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
