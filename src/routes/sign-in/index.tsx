import { createFileRoute, useRouter, useSearch } from '@tanstack/react-router'
import { Package } from 'lucide-react'
import { css } from 'styled-system/css'
import * as v from 'valibot'

import { authClient } from '../../features/auth/auth-client'
import { SignInWithEmailAndPasswordForm } from './-components/sign-in-with-email-and-password-form'
import { SignInError } from './-lib/error'
import { SignInSchema } from './-lib/schema'

const searchSchema = v.object({
  redirect: v.optional(v.string())
})

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
  gap: '4'
})

const signInBrand = css({
  margin: '0',
  fontSize: '3xl',
  fontWeight: 'bold',
  letterSpacing: 'wide',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2'
})

const signInTagline = css({
  margin: '0',
  color: 'fg.muted'
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
    <div className={signInPage}>
      <div className={signInPanel}>
        <p className={signInBrand}>
          <Package
            size={28}
            aria-hidden
          />
          Pantry
        </p>
        <p className={signInTagline}>自分の棚に入る</p>
        <SignInWithEmailAndPasswordForm onSignIn={onSignIn} />
      </div>
    </div>
  )
}
