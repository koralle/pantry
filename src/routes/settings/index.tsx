import { createFileRoute } from '@tanstack/react-router'

function SettingsPage() {
  return <h1>Settings</h1>
}

export const Route = createFileRoute('/settings/')({ component: SettingsPage })
