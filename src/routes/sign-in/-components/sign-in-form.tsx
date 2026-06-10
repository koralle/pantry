import { Input } from '@base-ui/react'
import { Field, getInput, useForm } from '@formisch/react'
import type { MouseEvent } from 'react'
import * as v from 'valibot'

import { authClient } from '../../../features/auth/auth-client'

const signInSchema = v.object({
  email: v.pipe(
    v.string('Please enter your email.'),
    v.nonEmpty('Please enter your email.'),
    v.email('The email address is badly formatted.')
  ),
  password: v.pipe(
    v.string('Please enter your password.'),
    v.nonEmpty('Please enter your password.'),
    v.minLength(8, 'Your password must have 8 characters or more.')
  )
})

export const SignInForm = () => {
  const signInForm = useForm({
    initialInput: {
      email: '',
      password: ''
    },
    schema: signInSchema
  })

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    const currentEmail = getInput(signInForm, { path: ['email'] })
    const currentPassword = getInput(signInForm, { path: ['password'] })

    await authClient.signIn.email({
      email: currentEmail ?? '',
      password: currentPassword ?? ''
    })
  }

  return (
    <form>
      <Field
        of={signInForm}
        path={['email']}>
        {(field) => (
          <Input
            value={field.input}
            type='email'
            onValueChange={(newValue) => {
              field.onChange(newValue)
            }}
          />
        )}
      </Field>
      <Field
        of={signInForm}
        path={['password']}>
        {(field) => (
          <Input
            value={field.input}
            type='password'
            onValueChange={(newValue) => {
              field.onChange(newValue)
            }}
          />
        )}
      </Field>
      <button
        type='button'
        onClick={ async (e) => handleClick(e)}>
        Sign In
      </button>
    </form>
  )
}
