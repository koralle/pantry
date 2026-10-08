import { useRouter } from "@tanstack/react-router";
import { CircleAlert, KeyRound } from "lucide-react";
import { useState, useTransition } from "react";
import { css } from "styled-system/css";

import { StyledButton } from "../../../../shared/components/styled-button";
import {
  formSummary,
  formSummaryIcon,
  formSummaryText,
} from "../../../../shared/styles/form";
import { authClient } from "../../lib/auth-client";
import { getPasskeySignInErrorMessage } from "../../lib/passkey/messages";
import { isWebAuthnAvailable } from "../../lib/passkey/webauthn-support";

const passkeySignIn = css({
  display: "flex",
  flexDirection: "column",
  gap: "5",
  marginBlockStart: "2",
});

const passkeySignInActions = css({
  "& > button": {
    inlineSize: "stretch",
  },
  display: "flex",
});

const passkeyDivider = css({
  "&::before, &::after": {
    borderBlockStartColor: "border.default",
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "thin",
    content: '""',
  },
  alignItems: "center",
  color: "fg.muted",
  columnGap: "3",
  display: "grid",
  fontSize: "xs",
  gridTemplateColumns: "1fr auto 1fr",
});

export const PasskeySignIn = ({
  redirect,
}: {
  readonly redirect: string | undefined;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isWebAuthnAvailable()) {
    return null;
  }

  const handlePasskeySignIn = () => {
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const { error } = await authClient.signIn.passkey();
        if (error !== null && error !== undefined) {
          const message = getPasskeySignInErrorMessage(error);
          if (message !== null && message !== undefined) {
            startTransition(() => {
              setErrorMessage(message);
            });
          }
          return;
        }

        await router.navigate({ to: redirect ?? "/bookmarks" });
      } catch {
        startTransition(() => {
          setErrorMessage(getPasskeySignInErrorMessage({}));
        });
      }
    });
  };

  return (
    <div className={passkeySignIn}>
      <div className={passkeySignInActions}>
        <StyledButton
          type="button"
          visual="accent"
          onPress={handlePasskeySignIn}
          isDisabled={isPending}
        >
          <KeyRound size={16} aria-hidden />
          {isPending ? "端末で認証中…" : "パスキーでログイン"}
        </StyledButton>
      </div>
      {errorMessage === null || errorMessage === undefined ? null : (
        <div className={formSummary} role="alert" aria-live="polite">
          <CircleAlert aria-hidden className={formSummaryIcon} size={14} />
          <p className={formSummaryText}>{errorMessage}</p>
        </div>
      )}
      <div className={passkeyDivider}>または</div>
    </div>
  );
};
