import { createFileRoute } from '@tanstack/react-router'

import { SettingsScreen } from '../../../features/settings/components/settings-screen'

export const Route = createFileRoute('/_protected/settings/')({
  loader: async ({ context }) => ({
    user: context.user
  }),
  component: RouteComponent
})

function RouteComponent() {
  const { user } = Route.useLoaderData()

  return <SettingsScreen user={user} />
}
