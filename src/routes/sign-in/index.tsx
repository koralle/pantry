import { createFileRoute, useRouter, useSearch } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import * as v from 'valibot'

import { SignInWithEmailAndPasswordForm } from '../../features/auth/components/sign-in-form'
import { authClient } from '../../features/auth/lib/auth-client'
import { SignInError } from '../../features/auth/lib/sign-in-error'
import type { SignInSchema } from '../../features/auth/lib/sign-in-schema'
import { pageLead } from '../../styles/type'

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

const signInPage = css({
  minBlockSize: '100dvh',
  display: 'grid',
  placeItems: 'center',
  paddingBlock: '6',
  paddingInline: '4',
  backgroundImage:
    'radial-gradient(ellipse at 20% 0%, color-mix(in oklab, {colors.pantry.accent} 10%, transparent), transparent 55%)',
  backgroundColor: 'bg.canvas'
})

const signInPanel = css({
  width: '22rem',
  maxInlineSize: 'full',
  display: 'flex',
  flexDirection: 'column',
  gap: '5'
})

const signInBrand = css({
  margin: '0',
  fontSize: '3xl',
  fontWeight: 'bold',
  letterSpacing: 'wide',
  lineHeight: 'tight'
})

function SignInScreen({ redirect }: { readonly redirect: string | undefined }) {
  const router = useRouter()

  async function onSignIn({ email, password }: SignInSchema) {
    const { error } = await authClient.signIn.email({ email, password })

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
    <div className={signInPage}>
      <div className={signInPanel}>
        <p className={signInBrand}>Pantry</p>
        <p className={pageLead}>自分の棚に入る</p>
        <SignInWithEmailAndPasswordForm onSignIn={onSignIn} />
      </div>
    </div>
  )
}
