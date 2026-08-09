import { Field, getInput, useForm } from '@formisch/react'
import { CircleAlert, Lock, LogIn, Mail } from 'lucide-react'
import { useActionState } from 'react'
import { css, cx } from 'styled-system/css'
import { parseAsync } from 'valibot'

import { StyledButton } from '../../../shared/components/styled-button'
import { StyledInput } from '../../../shared/components/styled-input'
import { StyledLabel } from '../../../shared/components/styled-label'
import { field, fieldError, formSummary } from '../../../styles/form'
import { srOnly } from '../../../styles/sr-only'
import { workbenchFields, workbenchForm } from '../../../styles/workbench'
import { SignInError } from '../lib/sign-in-error'
import { emailSchema, passwordSchema, signInSchema } from '../lib/sign-in-schema'
import type { SignInSchema } from '../lib/sign-in-schema'

const signInForm = css({
  marginBlockStart: '2'
})

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
  const signInFormInstance = useForm({
    initialInput: {
      email: '',
      password: ''
    },
    schema: signInSchema
  })

  const [signInError, throwError, isPending] = useActionState(async () => {
    const currentRawEmail = getInput(signInFormInstance, { path: ['email'] }) ?? ''
    const currentRawPassword = getInput(signInFormInstance, { path: ['password'] }) ?? ''

    const verifiedCurrentEmail = await parseAsync(emailSchema, currentRawEmail)
    const verifiedCurrentPassword = await parseAsync(passwordSchema, currentRawPassword)

    const error = await onSignIn({ email: verifiedCurrentEmail, password: verifiedCurrentPassword })

    return error
  }, null)

  const fieldErrorText =
    signInError?.code === 'INVALID_EMAIL_OR_PASSWORD'
      ? 'メールまたはパスワードを確認してください'
      : null

  return (
    <form
      className={cx(workbenchForm, signInForm)}
      action={throwError}
      noValidate>
      {signInError != null ? (
        <div
          className={formSummary}
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
        className={workbenchFields}
        disabled={isPending}>
        <legend className={srOnly}>ログイン</legend>

        <Field
          of={signInFormInstance}
          path={['email']}>
          {(fieldProps) => (
            <div className={field}>
              <StyledLabel htmlFor={fieldProps.props.name}>
                <Mail
                  size={16}
                  aria-hidden
                />
                メール
              </StyledLabel>

              <StyledInput
                id={fieldProps.props.name}
                value={fieldProps.input}
                type='email'
                onChange={(event) => {
                  fieldProps.onChange(event.target.value)
                }}
                autoComplete='email webauthn'
                required
                aria-invalid={fieldErrorText != null}
              />
              {fieldErrorText != null ? <p className={fieldError}>{fieldErrorText}</p> : null}
            </div>
          )}
        </Field>

        <Field
          of={signInFormInstance}
          path={['password']}>
          {(fieldProps) => (
            <div className={field}>
              <StyledLabel htmlFor={fieldProps.props.name}>
                <Lock
                  size={16}
                  aria-hidden
                />
                パスワード
              </StyledLabel>

              <StyledInput
                id={fieldProps.props.name}
                value={fieldProps.input}
                type='password'
                onChange={(event) => {
                  fieldProps.onChange(event.target.value)
                }}
                autoComplete='current-password webauthn'
                required
                aria-invalid={fieldErrorText != null}
              />
              {fieldErrorText != null ? <p className={fieldError}>{fieldErrorText}</p> : null}
            </div>
          )}
        </Field>
      </fieldset>

      <StyledButton
        type='submit'
        visual='accent'
        isDisabled={isPending}>
        <LogIn
          size={16}
          aria-hidden
        />
        {isPending ? 'サインイン中...' : 'サインイン'}
      </StyledButton>
    </form>
  )
}
