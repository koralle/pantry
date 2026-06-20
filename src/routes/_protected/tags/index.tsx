import { createFileRoute, ErrorComponent, ErrorComponentProps } from '@tanstack/react-router'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import * as v from 'valibot'

import { ErrorFallback } from '../../../components/error-fallback'
import { ensureSession } from '../../../features/auth/auth.function'
import { TagTable } from '../../../features/tags/tag-table'
import { fetchTags } from '../../../features/tags/tag.function'
import { offsetPaginationQuerySchema } from '../../../schemas/pagination'

const tagsSearchSchema = v.object({
  ...offsetPaginationQuerySchema.entries
})

export const Route = createFileRoute('/_protected/tags/')({
  validateSearch: (search) => v.parseAsync(tagsSearchSchema, search),
  loader: async ({ location }) => {
    const { user } = await ensureSession()
    const search = await v.parseAsync(tagsSearchSchema, location.search)

    const tagsPromise = fetchTags({ data: { limit: search.limit, offset: search.offset } })

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
  const { user, tagsPromise } = Route.useLoaderData()

  return (
    <>
      <h1>{user.name}のタグ一覧</h1>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<p>Loading...</p>}>
          <TagTable tagPromise={tagsPromise} />
        </Suspense>
      </ErrorBoundary>
    </>
  )
}
