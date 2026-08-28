import type { QueryClient } from '@tanstack/react-query'

import { orpc } from '../../../rpc/query'
import { getRpcClient } from '../../../rpc/runtime-client'
import { refreshAfterCreateTag } from '../../tags/lib/refresh-after-create-tag'
import { executeCreateTagFromPicker } from './execute-create-tag-from-picker'
import type { CreateTagFromPickerAction } from './execute-create-tag-from-picker'

export function createTagFromPickerAction(deps: {
  readonly queryClient: QueryClient
  readonly router: { invalidate: () => Promise<unknown> }
}): CreateTagFromPickerAction {
  return async (_previous, { name }) => {
    const client = await getRpcClient()
    const result = await executeCreateTagFromPicker({
      name,
      createTag: async (tagName) => client.tags.create({ name: tagName }),
      loadTags: async () => {
        const tags = await deps.queryClient.fetchQuery(
          orpc.tags.shelf.queryOptions({ staleTime: 0 })
        )
        return tags.map((tag) => ({ id: tag.id, name: tag.name }))
      }
    })

    if (result.status === 'created') {
      refreshAfterCreateTag(deps.router)
      void deps.queryClient
        .invalidateQueries({
          queryKey: orpc.tags.shelf.queryOptions().queryKey
        })
        .catch((error: unknown) => {
          console.error('Failed to refresh tag shelf after CreateTag', error)
        })
    }

    return result
  }
}
