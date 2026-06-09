import { Input } from '@base-ui/react'
import { Field, getInput, useForm } from '@formisch/react'
import { useActionState } from 'react'
import { parseAsync } from 'valibot'

import { SignInError } from '../-lib/error'
import { emailSchema, passwordSchema, signInSchema } from '../-lib/schema'
import type { SignInSchema } from '../-lib/schema'

interface SignInWithEmailAndPasswordFormProps {
  readonly onSignIn: ({ email, password }: SignInSchema) => Promise<SignInError | null>
}

export const SignInWithEmailAndPasswordForm = ({
  onSignIn
}: SignInWithEmailAndPasswordFormProps) => {
  const signInForm = useForm({
    initialInput: {
      email: '',
      password: ''
    },
    schema: signInSchema
  })

  const [_, throwError, isPending] = useActionState(async () => {
    const currentRawEmail = getInput(signInForm, { path: ['email'] }) ?? ''
    const currentRawPassword = getInput(signInForm, { path: ['password'] }) ?? ''

    const verifiedCurrentEmail = await parseAsync(emailSchema, currentRawEmail)
    const verifiedCurrentPassword = await parseAsync(passwordSchema, currentRawPassword)

    const error = await onSignIn({ email: verifiedCurrentEmail, password: verifiedCurrentPassword })

    return error
  }, null)

  return (
    <form action={throwError}>
      <fieldset>
        <legend>ログイン</legend>

        <Field
          of={signInForm}
          path={['email']}>
          {(field) => (
            <label htmlFor={field.props.name}>
              Email
              <Input
                id={field.props.name}
                value={field.input}
                type='email'
                onValueChange={(newValue) => {
                  field.onChange(newValue)
                }}
                autoComplete='email webauthn'
                required
              />
            </label>
          )}
        </Field>

        <Field
          of={signInForm}
          path={['password']}>
          {(field) => (
            <label htmlFor={field.props.name}>
              Password
              <Input
                id={field.props.name}
                value={field.input}
                type='password'
                onValueChange={(newValue) => {
                  field.onChange(newValue)
                }}
                autoComplete='current-password webauthn'
                required
              />
            </label>
          )}
        </Field>
      </fieldset>

      <button
        type='submit'
        disabled={isPending}>
        Sign In
      </button>
    </form>
  )
}
