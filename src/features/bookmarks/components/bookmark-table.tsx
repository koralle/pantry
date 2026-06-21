import { use } from 'react'

import { BookmarkSelectType } from '../../../db/schema/bookmark'

interface BookmarkTableProps {
  readonly bookmarkPromise: Promise<BookmarkSelectType[]>
}

export function BookmarkTable({ bookmarkPromise }: BookmarkTableProps) {
  const tags = use(bookmarkPromise)

  return (
    <table>
      <thead>
        <tr>
          <th>id</th>
          <th>タイトル</th>
          <th>URL</th>
          <th>説明</th>
          <th>最終更新日</th>
        </tr>
      </thead>
      <tbody>
        {tags.map((tag) => (
          <tr key={tag.id}>
            <td>{tag.id}</td>
            <td>{tag.title}</td>
            <td>{tag.url}</td>
            <td>{tag.note}</td>
            <td>{tag.updatedAt.toString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
