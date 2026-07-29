import { createFileRoute, useSearch } from '@tanstack/react-router'
import * as v from 'valibot'

import { SignInScreen } from '../../features/auth/components/sign-in-screen'

const searchSchema = v.object({
  redirect: v.optional(v.string())
})

export const Route = createFileRoute('/sign-in/')({
  validateSearch: (search) => v.parse(searchSchema, search),
  component: RouteComponent
})

function RouteComponent() {
  const { redirect } = useSearch({ from: '/sign-in/' })

  return <SignInScreen redirect={redirect} />
}
