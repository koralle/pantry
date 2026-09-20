import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithValibot } from "@conform-to/valibot";
import { CircleAlert, Lock, LogIn, Mail } from "lucide-react";
import { startTransition, useActionState } from "react";
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
import { signInForm, workbenchFields, workbenchForm } from "./styles";

interface SignInWithEmailAndPasswordFormProps {
  readonly onSignIn: ({
    email,
    password,
  }: SignInSchema) => Promise<SignInError | null>;
}

const signInErrorMessage = (error: SignInError): string => {
  if (error.code === "INVALID_EMAIL_OR_PASSWORD") {
    return "メールまたはパスワードが正しくありません";
  }
  return "サインインに失敗しました。入力内容を確認してください";
};

export const SignInWithEmailAndPasswordForm = ({
  onSignIn,
}: SignInWithEmailAndPasswordFormProps) => {
  const [signInError, throwError, isPending] = useActionState(
    async (_previous: SignInError | null, formData: FormData) => {
      const submission = parseWithValibot(formData, {
        disableAutoCoercion: true,
        schema: signInSchema,
      });
      if (submission.status !== "success") {
        return null;
      }

      return await onSignIn(submission.value);
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
      {signInError === null || signInError === undefined ? null : (
        <div className={formSummary} role="alert" aria-live="polite">
          <CircleAlert aria-hidden className={formSummaryIcon} size={14} />
          <p className={formSummaryText}>{signInErrorMessage(signInError)}</p>
        </div>
      )}

      <fieldset className={workbenchFields} disabled={isPending}>
        <legend className={srOnly}>サインイン</legend>

        <div className={field}>
          <StyledLabel htmlFor={fields.email.id}>
            <Mail size={16} aria-hidden />
            メール
          </StyledLabel>

          <StyledInput
            {...getInputProps(fields.email, { type: "email" })}
            autoComplete="email webauthn"
            placeholder="you@example.com"
            required
            aria-invalid={emailError !== null && emailError !== undefined}
          />
          {emailError === null || emailError === undefined ? null : (
            <p className={fieldError}>
              <CircleAlert size={12} aria-hidden /> {emailError}
            </p>
          )}
        </div>

        <div className={field}>
          <StyledLabel htmlFor={fields.password.id}>
            <Lock size={16} aria-hidden />
            パスワード
          </StyledLabel>

          <StyledInput
            {...getInputProps(fields.password, { type: "password" })}
            autoComplete="current-password webauthn"
            placeholder="••••••••"
            required
            aria-invalid={passwordError !== null && passwordError !== undefined}
          />
          {passwordError === null || passwordError === undefined ? null : (
            <p className={fieldError}>
              <CircleAlert size={12} aria-hidden /> {passwordError}
            </p>
          )}
        </div>
      </fieldset>

      <StyledButton type="submit" isDisabled={isPending}>
        <LogIn size={16} aria-hidden />
        {isPending ? "サインイン中..." : "サインイン"}
      </StyledButton>
    </form>
  );
};
