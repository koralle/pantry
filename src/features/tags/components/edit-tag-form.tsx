import { use } from 'react'

import type { TagRecord } from '../lib/tag-shelf'
import { getUpdateTagErrorMessage } from '../lib/get-update-tag-error-message'
import { TagForm } from './tag-form'

type EditTagFormProps = {
  readonly tagPromise: Promise<TagRecord>
  readonly submitAction: (input: {
    id: number
    name: string
    pinned: boolean
    color: string | null
    sortOrder: number
  }) => Promise<void>
}

export function EditTagForm({ tagPromise, submitAction }: EditTagFormProps) {
  const tag = use(tagPromise)

  return (
    <TagForm
      initialValues={{
        name: tag.name,
        pinned: tag.pinned,
        color: tag.color,
        sortOrder: tag.sortOrder
      }}
      legend='タグ編集'
      submitLabel='更新'
      pendingLabel='更新中...'
      onSubmit={async ({ name, pinned, color, sortOrder }) => {
        await submitAction({
          id: tag.id,
          name,
          pinned,
          color,
          sortOrder
        })
      }}
      mapError={getUpdateTagErrorMessage}
    />
  )
}
