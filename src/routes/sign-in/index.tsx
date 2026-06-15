import { createFileRoute, useRouter, useSearch } from '@tanstack/react-router'
import * as v from 'valibot'

import { authClient } from '../../features/auth/auth-client'
import { SignInWithEmailAndPasswordForm } from './-components/sign-in-with-email-and-password-form'
import { SignInError } from './-lib/error'
import { SignInSchema } from './-lib/schema'

const searchSchema = v.object({
  redirect: v.optional(v.string())
})

export const Route = createFileRoute('/sign-in/')({
  validateSearch: (search) => v.parse(searchSchema, search),
  component: RouteComponent
})

function RouteComponent() {
  const router = useRouter()
  const { redirect } = useSearch({ from: '/sign-in/' })

  async function onSignIn({ email, password }: SignInSchema) {
    const { error } = await authClient.signIn.email({
      email,
      password
    })

    if (error === null) {
      await router.navigate({ to: redirect ?? '/' })
      return null
    }

    return new SignInError({
      code: error.code,
      status: error.status,
      statusText: error.statusText
    })
  }

  return (
    <>
      <h1>Sign In</h1>
      <SignInWithEmailAndPasswordForm onSignIn={onSignIn} />
    </>
  )
}
