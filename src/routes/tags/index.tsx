import { createFileRoute } from '@tanstack/react-router'

import { tagQueryOptions, useTags } from './-queries/use-tag-query'

function RouteComponent() {
  const { data } = useTags()

  return (
    <ul>
      {data.map(({ id, name }) => (
        <li key={id}>
          {id}: {name}
        </li>
      ))}
    </ul>
  )
}

export const Route = createFileRoute('/tags/')({
  component: RouteComponent,
  loader: ({ context }) => {
    // oxlint-disable-next-line typescript/no-floating-promises
    context.queryClient.prefetchQuery(tagQueryOptions)
  },
  pendingComponent: () => <p>Loading...</p>
})
