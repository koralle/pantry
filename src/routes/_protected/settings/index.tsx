import { createFileRoute } from '@tanstack/react-router'

import { ensureSession } from '../../../features/auth/functions/ensure-session'
import { SettingsScreen } from '../../../features/settings/components/settings-screen'

export const Route = createFileRoute('/_protected/settings/')({
  loader: async () => {
    const { user } = await ensureSession()
    return { user }
  },
  component: RouteComponent
})

function RouteComponent() {
  const { user } = Route.useLoaderData()

  return <SettingsScreen user={user} />
}
