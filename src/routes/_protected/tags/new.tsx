import { createFileRoute } from '@tanstack/react-router'

import { NewTagScreen } from '../../../features/tags/components/new-tag-screen'

export const Route = createFileRoute('/_protected/tags/new')({
  component: RouteComponent
})

function RouteComponent() {
  return <NewTagScreen />
}
