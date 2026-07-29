import { createFileRoute } from '@tanstack/react-router'
import * as v from 'valibot'

import { TagDetailScreen } from '../../../../features/tags/components/tag-detail-screen'
import { getTag } from '../../../../features/tags/functions/get-tag'

const tagIdParamSchema = v.pipe(v.string(), v.transform(Number), v.integer('Invalid tag id'))

const tagDetailSearchSchema = v.object({
  created: v.optional(v.boolean())
})

export const Route = createFileRoute('/_protected/tags/$id/')({
  validateSearch: tagDetailSearchSchema,
  loader: async ({ params }) => {
    const id = v.parse(tagIdParamSchema, params.id)
    const tagPromise = getTag({ data: { id } })
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
