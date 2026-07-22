import { Input } from '@base-ui/react'
import { Field, getInput, useForm } from '@formisch/react'
import { CircleAlert, Lock, LogIn, Mail } from 'lucide-react'
import { useActionState } from 'react'
import { parseAsync } from 'valibot'

import { SignInError } from '../-lib/error'
import { emailSchema, passwordSchema, signInSchema } from '../-lib/schema'
import type { SignInSchema } from '../-lib/schema'

interface SignInWithEmailAndPasswordFormProps {
  readonly onSignIn: ({ email, password }: SignInSchema) => Promise<SignInError | null>
}

function signInErrorMessage(error: SignInError): string {
  if (error.code === 'INVALID_EMAIL_OR_PASSWORD') {
    return 'メールまたはパスワードが正しくありません'
  }
  return 'サインインに失敗しました。入力内容を確認してください'
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

  const [signInError, throwError, isPending] = useActionState(async () => {
    const currentRawEmail = getInput(signInForm, { path: ['email'] }) ?? ''
    const currentRawPassword = getInput(signInForm, { path: ['password'] }) ?? ''

    const verifiedCurrentEmail = await parseAsync(emailSchema, currentRawEmail)
    const verifiedCurrentPassword = await parseAsync(passwordSchema, currentRawPassword)

    const error = await onSignIn({ email: verifiedCurrentEmail, password: verifiedCurrentPassword })

    return error
  }, null)

  const fieldError =
    signInError?.code === 'INVALID_EMAIL_OR_PASSWORD'
      ? 'メールまたはパスワードを確認してください'
      : null

  return (
    <form
      className='pantry-workbench-form pantry-sign-in__form'
      action={throwError}
      noValidate>
      {signInError != null ? (
        <div
          className='pantry-form-summary'
          role='alert'
          aria-live='polite'>
          <p>
            <CircleAlert
              size={16}
              aria-hidden
            />{' '}
            {signInErrorMessage(signInError)}
          </p>
        </div>
      ) : null}

      <fieldset
        className='pantry-workbench-form__fields'
        disabled={isPending}>
        <legend className='pantry-sr-only'>ログイン</legend>

        <Field
          of={signInForm}
          path={['email']}>
          {(field) => (
            <div className='pantry-field'>
              <label htmlFor={field.props.name}>
                <Mail
                  size={16}
                  aria-hidden
                />{' '}
                メール
              </label>
              <Input
                id={field.props.name}
                value={field.input}
                type='email'
                onValueChange={(newValue) => {
                  field.onChange(newValue)
                }}
                autoComplete='email webauthn'
                required
                aria-invalid={fieldError != null}
              />
              {fieldError != null ? <p className='pantry-field__error'>{fieldError}</p> : null}
            </div>
          )}
        </Field>

        <Field
          of={signInForm}
          path={['password']}>
          {(field) => (
            <div className='pantry-field'>
              <label htmlFor={field.props.name}>
                <Lock
                  size={16}
                  aria-hidden
                />{' '}
                パスワード
              </label>
              <Input
                id={field.props.name}
                value={field.input}
                type='password'
                onValueChange={(newValue) => {
                  field.onChange(newValue)
                }}
                autoComplete='current-password webauthn'
                required
                aria-invalid={fieldError != null}
              />
              {fieldError != null ? <p className='pantry-field__error'>{fieldError}</p> : null}
            </div>
          )}
        </Field>
      </fieldset>

      <button
        type='submit'
        className='pantry-button pantry-button--accent'
        disabled={isPending}>
        <LogIn
          size={16}
          aria-hidden
        />{' '}
        {isPending ? 'サインイン中...' : 'サインイン'}
      </button>
    </form>
  )
}
