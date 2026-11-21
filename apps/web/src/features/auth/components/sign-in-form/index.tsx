import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithValibot } from "@conform-to/valibot";
import type { Result } from "@pantry/utils/result";
import { CircleAlert, Eye, EyeOff, Lock, LogIn, Mail } from "lucide-react";
import { startTransition, useActionState, useState } from "react";
import { cx } from "styled-system/css";

import { StyledButton } from "../../../../shared/components/styled-button";
import { StyledInput } from "../../../../shared/components/styled-input";
import { StyledLabel } from "../../../../shared/components/styled-label";
import {
  field,
  fieldError,
  formSummary,
  formSummaryIcon,
  formSummaryText,
} from "../../../../shared/styles/form";
import { srOnly } from "../../../../shared/styles/sr-only";
import type { SignInError } from "../../lib/sign-in-error";
import { signInSchema } from "../../lib/sign-in-schema";
import type { SignInSchema } from "../../lib/sign-in-schema";
import {
  passwordInput,
  passwordToggle,
  passwordWrap,
  signInForm,
  workbenchFields,
  workbenchForm,
} from "./styles";

type EmailSignInAction = (
  credentials: SignInSchema
) => Promise<Result<void, SignInError>>;

interface SignInWithEmailAndPasswordFormProps {
  /** Called and awaited inside a Transition. */
  readonly signInAction: EmailSignInAction;
}

const signInErrorMessage = (error: SignInError): string => {
  if (error.code === "INVALID_EMAIL_OR_PASSWORD") {
    return "メールまたはパスワードが正しくありません";
  }
  return "サインインに失敗しました。入力内容を確認してください";
};

const FieldErrorLine = ({
  id,
  message,
}: {
  readonly id: string;
  readonly message: string | null | undefined;
}) =>
  message ? (
    <p className={fieldError} id={id} role="alert">
      <CircleAlert aria-hidden size={12} /> {message}
    </p>
  ) : null;

export const SignInWithEmailAndPasswordForm = ({
  signInAction,
}: SignInWithEmailAndPasswordFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [signInError, throwError, isPending] = useActionState(
    async (_previous: SignInError | null, formData: FormData) => {
      const submission = parseWithValibot(formData, {
        disableAutoCoercion: true,
        schema: signInSchema,
      });
      if (submission.status !== "success") {
        return null;
      }

      const result = await signInAction(submission.value);
      if (!result.ok) {
        return result.error;
      }
      return null;
    },
    null
  );

  const [form, fields] = useForm<SignInSchema>({
    defaultValue: {
      email: "",
      password: "",
    },
    onSubmit(event, { formData, submission }) {
      event.preventDefault();
      if (submission?.status !== "success") {
        return;
      }
      startTransition(() => {
        throwError(formData);
      });
    },
    onValidate({ formData }) {
      return parseWithValibot(formData, {
        disableAutoCoercion: true,
        schema: signInSchema,
      });
    },
    shouldRevalidate: "onInput",
    shouldValidate: "onSubmit",
  });

  const fieldErrorText =
    signInError?.code === "INVALID_EMAIL_OR_PASSWORD"
      ? "メールまたはパスワードを確認してください"
      : null;
  const emailError = fields.email.errors?.[0] ?? fieldErrorText;
  const passwordError = fields.password.errors?.[0] ?? fieldErrorText;

  return (
    <form
      className={cx(workbenchForm, signInForm)}
      {...getFormProps(form)}
      action={throwError}
    >
      {signInError ? (
        <div aria-live="polite" className={formSummary} role="alert">
          <CircleAlert aria-hidden className={formSummaryIcon} size={14} />
          <p className={formSummaryText}>{signInErrorMessage(signInError)}</p>
        </div>
      ) : null}

      <fieldset className={workbenchFields} disabled={isPending}>
        <legend className={srOnly}>サインイン</legend>

        <div className={field}>
          <StyledLabel htmlFor={fields.email.id}>
            <Mail aria-hidden size={15} />
            メール
          </StyledLabel>

          <StyledInput
            {...getInputProps(fields.email, { type: "email" })}
            aria-describedby={emailError ? fields.email.errorId : undefined}
            aria-invalid={Boolean(emailError)}
            autoCapitalize="none"
            autoComplete="email"
            enterKeyHint="next"
            placeholder="you@example.com"
            required
            spellCheck={false}
          />
          <FieldErrorLine id={fields.email.errorId} message={emailError} />
        </div>

        <div className={field}>
          <StyledLabel htmlFor={fields.password.id}>
            <Lock aria-hidden size={15} />
            パスワード
          </StyledLabel>

          <div className={passwordWrap}>
            <StyledInput
              {...getInputProps(fields.password, {
                type: showPassword ? "text" : "password",
              })}
              aria-describedby={
                passwordError ? fields.password.errorId : undefined
              }
              aria-invalid={Boolean(passwordError)}
              autoComplete="current-password"
              className={passwordInput}
              enterKeyHint="done"
              placeholder="••••••••"
              required
            />
            <button
              aria-label={
                showPassword ? "パスワードを隠す" : "パスワードを表示"
              }
              aria-pressed={showPassword}
              className={passwordToggle}
              onClick={() => {
                setShowPassword((prev) => !prev);
              }}
              type="button"
            >
              {showPassword ? (
                <EyeOff aria-hidden size={16} />
              ) : (
                <Eye aria-hidden size={16} />
              )}
            </button>
          </div>
          <FieldErrorLine
            id={fields.password.errorId}
            message={passwordError}
          />
        </div>
      </fieldset>

      <StyledButton isDisabled={isPending} type="submit">
        <LogIn aria-hidden size={16} />
        {isPending ? "サインイン中..." : "サインイン"}
      </StyledButton>
    </form>
  );
};
