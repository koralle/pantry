import { createFileRoute } from '@tanstack/react-router'
import * as v from 'valibot'

import { EditTagScreen } from '../../../features/tags/components/edit-tag-screen'
import { getTag } from '../../../features/tags/functions/get-tag'

const tagIdParamSchema = v.pipe(v.string(), v.transform(Number), v.integer('Invalid tag id'))

export const Route = createFileRoute('/_protected/tags/$id/edit')({
  loader: async ({ params }) => {
    const id = v.parse(tagIdParamSchema, params.id)
    const tagPromise = getTag({ data: { id } })

    return {
      tagPromise
    }
  },
  component: RouteComponent
})

function RouteComponent() {
  const { tagPromise } = Route.useLoaderData()

  return <EditTagScreen tagPromise={tagPromise} />
}
