import {
  createFileRoute,
  ErrorComponent,
  ErrorComponentProps,
  getRouteApi
} from '@tanstack/react-router'
import * as v from 'valibot'

import { TagManagementScreen } from '../../../features/tags/components/tag-management-screen'
import { offsetPaginationQuerySchema } from '../../../schemas/pagination'

const tagsSearchSchema = v.object({
  ...offsetPaginationQuerySchema.entries
})

const protectedRouteApi = getRouteApi('/_protected')

export const Route = createFileRoute('/_protected/tags/')({
  validateSearch: (search) => v.parse(tagsSearchSchema, search),
  component: RouteComponent,
  errorComponent: TagPageFallbackComponent
})

function TagPageFallbackComponent({ error }: ErrorComponentProps) {
  return <ErrorComponent error={error} />
}

function RouteComponent() {
  const { shelfTagsPromise } = protectedRouteApi.useLoaderData()

  return <TagManagementScreen tagsPromise={shelfTagsPromise} />
}
