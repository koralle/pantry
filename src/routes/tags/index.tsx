import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

interface Users {
  readonly id: number
  readonly name: string
}

const fetchUsers = () => [{ id: 1, name: 'むぎちゃ' }]

function RouteComponent() {
  const { data } = useSuspenseQuery<Users[]>({
    queryFn: () => fetchUsers(),
    queryKey: []
  })

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
    context.queryClient.prefetchQuery({
      queryFn: () => fetchUsers(),
      queryKey: []
    })
  }
})
