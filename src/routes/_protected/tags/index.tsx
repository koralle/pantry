import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/tags/')({
  component: RouteComponent
})

function RouteComponent() {
  return <div>Hello Tag!</div>
}
