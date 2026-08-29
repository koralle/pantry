import { createFileRoute, useRouter, useSearch } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { grid } from 'styled-system/patterns'
import * as v from 'valibot'

import { PasskeySignIn } from '../../features/auth/components/passkey-sign-in'
import { SignInWithEmailAndPasswordForm } from '../../features/auth/components/sign-in-form'
import { authClient } from '../../features/auth/lib/auth-client'
import { isInternalPath } from '../../features/auth/lib/is-internal-path'
import { SignInError } from '../../features/auth/lib/sign-in-error'
import type { SignInSchema } from '../../features/auth/lib/sign-in-schema'

const internalRedirectSchema = v.pipe(v.string(), v.check(isInternalPath))

const searchSchema = v.object({
  redirect: v.optional(internalRedirectSchema)
})

export const Route = createFileRoute('/sign-in/')({
  validateSearch: (search) => v.parse(searchSchema, search),
  component: RouteComponent
})

function RouteComponent() {
  const { redirect } = useSearch({ from: '/sign-in/' })
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
    <div
      className={grid({
        gridTemplateRows: '1fr',
        containerName: 'sign-in-page-root',
        containerType: 'inline-size',
        minBlockSize: '100svb'
      })}>
      <div
        className={grid({
          minBlockSize: 'stretch',
          '@container sign-in-page-root (min-inline-size: 60rem)': {
            gridTemplateColumns: '1fr 1fr'
          }
        })}>
        <div
          className={css({
            display: 'none',
            '@container sign-in-page-root (min-inline-size: 60rem)': {
              display: 'grid',
              minInlineSize: 0,
              padding: 2
            }
          })}>
          <div
            className={grid({
              placeContent: 'center',
              backgroundColor: 'accent.solid',
              color: 'accent.fg',
              borderRadius: 'sheet'
            })}>
            <p
              translate='no'
              className={css({
                margin: 0,
                fontSize: 'title',
                fontWeight: 'bold',
                lineHeight: 'tight'
              })}>
              Pantry
            </p>
          </div>
        </div>

        <section
          className={css({
            display: 'grid',
            placeItems: 'center',
            minInlineSize: 0,
            paddingInline: 4,
            '@container sign-in-page-root (min-inline-size: 60rem)': {
              paddingInline: 12
            }
          })}>
          <div
            className={grid({
              paddingInline: 6,
              paddingBlock: 10,
              borderRadius: 'sheet',
              inlineSize: 'min(100%, 30rem)',
              '& button[type="submit"]': {
                inlineSize: 'stretch'
              }
            })}>
            <h1 className={css({ textAlign: 'center' })}>ログイン</h1>
            <PasskeySignIn redirect={redirect} />
            <SignInWithEmailAndPasswordForm onSignIn={onSignIn} />
          </div>
        </section>
      </div>
    </div>
  )
}
