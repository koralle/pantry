import { createFileRoute } from '@tanstack/react-router'
import * as v from 'valibot'

import { EditTagScreen } from '../../../features/tags/components/edit-tag-screen'
import { getRpcClient } from '../../../rpc/runtime-client'

const tagIdParamSchema = v.pipe(v.string(), v.transform(Number), v.integer('Invalid tag id'))

export const Route = createFileRoute('/_protected/tags/$id/edit')({
  loader: async ({ params }) => {
    const id = v.parse(tagIdParamSchema, params.id)
    const client = await getRpcClient()
    const tagPromise = client.tags.byId({ id })

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
