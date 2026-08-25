import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { parseWithValibot } from '@conform-to/valibot'
import { CircleAlert, Lock, LogIn, Mail } from 'lucide-react'
import { startTransition, useActionState } from 'react'
import { css, cx } from 'styled-system/css'

import { StyledButton } from '../../../shared/components/styled-button'
import { StyledInput } from '../../../shared/components/styled-input'
import { StyledLabel } from '../../../shared/components/styled-label'
import { field, fieldError, formSummary } from '../../../styles/form'
import { srOnly } from '../../../styles/sr-only'
import { workbenchFields, workbenchForm } from '../../../styles/workbench'
import { SignInError } from '../lib/sign-in-error'
import { signInSchema } from '../lib/sign-in-schema'
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
  const [signInError, throwError, isPending] = useActionState(
    async (_previous: SignInError | null, formData: FormData) => {
      const submission = parseWithValibot(formData, {
        disableAutoCoercion: true,
        schema: signInSchema
      })
      if (submission.status !== 'success') {
        return null
      }

      return await onSignIn(submission.value)
    },
    null
  )

  const [form, fields] = useForm<SignInSchema>({
    defaultValue: {
      email: '',
      password: ''
    },
    onSubmit(event, { formData, submission }) {
      event.preventDefault()
      if (submission?.status !== 'success') {
        return
      }
      startTransition(() => {
        throwError(formData)
      })
    },
    onValidate({ formData }) {
      return parseWithValibot(formData, { disableAutoCoercion: true, schema: signInSchema })
    },
    shouldRevalidate: 'onInput',
    shouldValidate: 'onSubmit'
  })

  const fieldErrorText =
    signInError?.code === 'INVALID_EMAIL_OR_PASSWORD'
      ? 'メールまたはパスワードを確認してください'
      : null
  const emailError = fields.email.errors?.[0] ?? fieldErrorText
  const passwordError = fields.password.errors?.[0] ?? fieldErrorText

  return (
    <form
      className={cx(workbenchForm, signInForm)}
      {...getFormProps(form)}
      action={throwError}>
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
        <legend className={srOnly}>サインイン</legend>

        <div className={field}>
          <StyledLabel htmlFor={fields.email.id}>
            <Mail
              size={16}
              aria-hidden
            />
            メール
          </StyledLabel>

          <StyledInput
            {...getInputProps(fields.email, { type: 'email' })}
            autoComplete='email webauthn'
            required
            aria-invalid={emailError != null}
          />
          {emailError != null ? <p className={fieldError}>{emailError}</p> : null}
        </div>

        <div className={field}>
          <StyledLabel htmlFor={fields.password.id}>
            <Lock
              size={16}
              aria-hidden
            />
            パスワード
          </StyledLabel>

          <StyledInput
            {...getInputProps(fields.password, { type: 'password' })}
            autoComplete='current-password webauthn'
            required
            aria-invalid={passwordError != null}
          />
          {passwordError != null ? <p className={fieldError}>{passwordError}</p> : null}
        </div>
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
