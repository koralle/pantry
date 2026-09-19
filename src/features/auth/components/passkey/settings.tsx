import { CircleAlert, CircleCheck, KeyRound, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { css, cx } from "styled-system/css";

import { StyledButton } from "../../../../shared/components/styled-button";
import {
  accountSectionHeadAction,
  accountSectionHeadRow,
  accountSectionHeading,
  passkeyEmpty,
  passkeyEmptyAction,
  passkeyEmptyIcon,
  passkeyEmptyNote,
  passkeyEmptyTitle,
} from "../../../../styles/account";
import { flash } from "../../../../styles/flash";
import {
  formSummary,
  formSummaryIcon,
  formSummaryText,
} from "../../../../styles/form";
import { authClient } from "../../lib/auth-client";
import {
  getPasskeyManageErrorMessage,
  getPasskeyRegisterErrorMessage,
} from "../../lib/passkey/messages";
import { isWebAuthnAvailable } from "../../lib/passkey/webauthn-support";
import { PasskeyListItem } from "./list-item";
import type { ManagedPasskey } from "./list-item";

const passkeyFeedback = css({
  display: "block",
  fontSize: "xs",
  marginBlockEnd: "3",
});

const passkeyLoading = css({
  color: "fg.faint",
  fontSize: "xs",
  margin: "0",
});

const toManagedPasskeys = (value: unknown): ManagedPasskey[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (
      item === null ||
      item === undefined ||
      typeof item !== "object" ||
      !("id" in item)
    ) {
      return [];
    }

    const record = item as {
      id?: unknown;
      name?: unknown;
      aaguid?: unknown;
      createdAt?: unknown;
    };

    if (typeof record.id !== "string") {
      return [];
    }

    const { createdAt } = record;
    if (!(createdAt instanceof Date) && typeof createdAt !== "string") {
      return [];
    }

    return [
      {
        aaguid: typeof record.aaguid === "string" ? record.aaguid : null,
        createdAt,
        id: record.id,
        name: typeof record.name === "string" ? record.name : null,
      },
    ];
  });
};

export const PasskeySettings = () => {
  const [webAuthnAvailable, setWebAuthnAvailable] = useState(false);
  const [passkeys, setPasskeys] = useState<ManagedPasskey[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const loadPasskeys = async () => {
    const { data, error } = await authClient.passkey.listUserPasskeys();
    if (error !== null && error !== undefined) {
      setErrorMessage(getPasskeyManageErrorMessage(error));
      setPasskeys((current) => current ?? []);
      return;
    }

    setPasskeys(toManagedPasskeys(data));
  };

  useEffect(() => {
    setWebAuthnAvailable(isWebAuthnAvailable());
    void loadPasskeys();
  }, []);

  const handleMutated = (message: string) => {
    setErrorMessage(null);
    setStatusMessage(message);
    void loadPasskeys();
  };

  const handleAdd = () => {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsAdding(true);
    void (async () => {
      try {
        const { error } = await authClient.passkey.addPasskey();
        if (error !== null && error !== undefined) {
          const message = getPasskeyRegisterErrorMessage(error);
          if (message !== null && message !== undefined) {
            setErrorMessage(message);
          }
          return;
        }
        setStatusMessage("パスキーを登録しました");
        await loadPasskeys();
      } catch {
        setErrorMessage(getPasskeyRegisterErrorMessage({}));
      } finally {
        setIsAdding(false);
      }
    })();
  };

  return (
    <>
      <div className={accountSectionHeadRow}>
        <h2 className={accountSectionHeading}>パスキー</h2>
        {webAuthnAvailable &&
        passkeys !== null &&
        passkeys !== undefined &&
        passkeys.length > 0 ? (
          <div className={accountSectionHeadAction}>
            <StyledButton
              isPending={isAdding}
              onPress={handleAdd}
              size="xs"
              visual="quiet"
            >
              <Plus size={13} aria-hidden /> {isAdding ? "登録中…" : "追加"}
            </StyledButton>
          </div>
        ) : null}
      </div>

      {errorMessage === null || errorMessage === undefined ? null : (
        <div
          className={cx(formSummary, passkeyFeedback)}
          role="alert"
          aria-live="polite"
        >
          <CircleAlert aria-hidden className={formSummaryIcon} size={14} />
          <p className={formSummaryText}>{errorMessage}</p>
        </div>
      )}

      {statusMessage === null || statusMessage === undefined ? null : (
        <output className={cx(flash, passkeyFeedback)} aria-live="polite">
          <CircleCheck
            size={14}
            aria-hidden
            className={css({ verticalAlign: "-2px" })}
          />{" "}
          {statusMessage}
        </output>
      )}

      {passkeys === null || passkeys === undefined ? (
        <p className={passkeyLoading}>読み込み中…</p>
      ) : null}

      {passkeys !== null &&
      passkeys !== undefined &&
      passkeys.length === 0 &&
      (errorMessage === null || errorMessage === undefined) ? (
        <div className={passkeyEmpty}>
          <span className={passkeyEmptyIcon}>
            <KeyRound size={18} aria-hidden />
          </span>
          <p className={passkeyEmptyTitle}>パスキーが未登録です</p>
          <p className={passkeyEmptyNote}>
            登録するとパスワードなしでサインインできます。
          </p>
          {webAuthnAvailable ? (
            <div className={passkeyEmptyAction}>
              <StyledButton
                isPending={isAdding}
                onPress={handleAdd}
                size="sm"
                visual="accent"
              >
                <Plus size={13} aria-hidden />{" "}
                {isAdding ? "登録中…" : "パスキーを登録"}
              </StyledButton>
            </div>
          ) : null}
        </div>
      ) : null}

      {passkeys !== null && passkeys !== undefined && passkeys.length > 0 ? (
        <div>
          {passkeys.map((passkey) => (
            <PasskeyListItem
              key={passkey.id}
              passkey={passkey}
              onMutated={handleMutated}
            />
          ))}
        </div>
      ) : null}
    </>
  );
};
