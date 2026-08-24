import { createFileRoute } from '@tanstack/react-router'
import * as v from 'valibot'

import { TagDetailScreen } from '../../../../features/tags/components/tag-detail-screen'
import { getRpcClient } from '../../../../rpc/runtime-client'

const tagIdParamSchema = v.pipe(v.string(), v.transform(Number), v.integer('Invalid tag id'))

const tagDetailSearchSchema = v.object({
  created: v.optional(v.boolean())
})

export const Route = createFileRoute('/_protected/tags/$id/')({
  validateSearch: tagDetailSearchSchema,
  loader: async ({ params }) => {
    const id = v.parse(tagIdParamSchema, params.id)
    const client = await getRpcClient()
    const tagPromise = client.tags.byId({ id })
    return { tagPromise }
  },
  component: RouteComponent
})

function RouteComponent() {
  const { id } = Route.useParams()
  const { tagPromise } = Route.useLoaderData()

  return (
    <TagDetailScreen
      id={id}
      tagPromise={tagPromise}
    />
  )
}
