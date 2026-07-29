import { createFileRoute, ErrorComponent, ErrorComponentProps } from '@tanstack/react-router'
import * as v from 'valibot'

import { ensureSession } from '../../../features/auth/functions/ensure-session'
import { TagManagementScreen } from '../../../features/tags/components/tag-management-screen'
import { fetchShelfTags } from '../../../features/tags/functions/fetch-shelf-tags'
import { offsetPaginationQuerySchema } from '../../../schemas/pagination'

const tagsSearchSchema = v.object({
  ...offsetPaginationQuerySchema.entries
})

export const Route = createFileRoute('/_protected/tags/')({
  validateSearch: (search) => v.parse(tagsSearchSchema, search),
  loader: async () => {
    const { user } = await ensureSession()
    const tagsPromise = fetchShelfTags()

    return {
      user,
      tagsPromise
    }
  },
  component: RouteComponent,
  errorComponent: TagPageFallbackComponent
})

function TagPageFallbackComponent({ error }: ErrorComponentProps) {
  return <ErrorComponent error={error} />
}

function RouteComponent() {
  const { tagsPromise } = Route.useLoaderData()

  return <TagManagementScreen tagsPromise={tagsPromise} />
}
