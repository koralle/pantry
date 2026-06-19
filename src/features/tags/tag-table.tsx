import { use } from 'react'

import { TagSelectType } from '../../db/schema/tag'

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
            <td>{tag.id}</td>
            <td>{tag.name}</td>
            <td>{tag.updatedAt.toString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
