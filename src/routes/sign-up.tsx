import { createFileRoute } from '@tanstack/react-router'

import { SignUpScreen } from '../features/auth/components/sign-up-screen'

export const Route = createFileRoute('/sign-up')({
  component: RouteComponent
})

function RouteComponent() {
  return <SignUpScreen />
}
