import { Plus } from "lucide-react";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { css } from "styled-system/css";

import { StyledButton } from "../../../../shared/components/styled-button";
import { authClient } from "../../lib/auth-client";
import {
  getPasskeyManageErrorMessage,
  getPasskeyRegisterErrorMessage,
} from "../../lib/passkey/messages";
import { isWebAuthnAvailable } from "../../lib/passkey/webauthn-support";
import {
  accountSectionHeadAction,
  accountSectionHeadRow,
  accountSectionHeading,
} from "../../styles";
import { PasskeyEmpty } from "./empty";
import { PasskeyFeedback } from "./feedback";
import { PasskeyListItem } from "./list-item";
import type { ManagedPasskey } from "./list-item";

// WebAuthn は browser でしか生えないため、SSR と client で値を分けて hydration mismatch を避ける。
const subscribeNothing = () => () => {
  // 可用性は起動後に変わらないので購読しない。
};
const getWebAuthnAvailable = () => isWebAuthnAvailable();
const getServerWebAuthnAvailable = () => false;

const passkeyLoading = css({
  color: "fg.faint",
  fontSize: "xs",
  margin: "0",
});

interface PasskeyRecord {
  readonly aaguid?: unknown;
  readonly createdAt?: unknown;
  readonly id?: unknown;
  readonly name?: unknown;
}

/**
 * Better Auth の戻り値は `unknown` 相当なので、型はここで絞る。
 * 型述語にしておくと downstream で `as` を書かずに済む。
 */
const isPasskeyRecord = (value: unknown): value is PasskeyRecord =>
  typeof value === "object" && value !== null;

const toManagedPasskeys = (value: unknown): ManagedPasskey[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!isPasskeyRecord(item) || !("id" in item)) {
      return [];
    }

    const { createdAt } = item;
    if (typeof item.id !== "string") {
      return [];
    }
    if (!(createdAt instanceof Date) && typeof createdAt !== "string") {
      return [];
    }

    return [
      {
        aaguid: typeof item.aaguid === "string" ? item.aaguid : null,
        createdAt,
        id: item.id,
        name: typeof item.name === "string" ? item.name : null,
      },
    ];
  });
};

export const PasskeySettings = () => {
  const webAuthnAvailable = useSyncExternalStore(
    subscribeNothing,
    getWebAuthnAvailable,
    getServerWebAuthnAvailable
  );
  const [passkeys, setPasskeys] = useState<ManagedPasskey[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const loadPasskeys = useCallback(async () => {
    const { data, error } = await authClient.passkey.listUserPasskeys();
    if (error !== null && error !== undefined) {
      setErrorMessage(getPasskeyManageErrorMessage(error));
      return;
    }

    setPasskeys(toManagedPasskeys(data));
  }, []);

  useEffect(() => {
    void loadPasskeys();
  }, [loadPasskeys]);

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

  const isLoaded = passkeys !== null;
  const hasPasskeys = isLoaded && passkeys.length > 0;
  const isEmpty = isLoaded && passkeys.length === 0;

  return (
    <>
      <div className={accountSectionHeadRow}>
        <h2 className={accountSectionHeading}>パスキー</h2>
        {webAuthnAvailable && hasPasskeys ? (
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

      <PasskeyFeedback
        errorMessage={errorMessage}
        statusMessage={statusMessage}
      />

      {isLoaded || errorMessage !== null ? null : (
        <p className={passkeyLoading}>読み込み中…</p>
      )}

      {isEmpty ? (
        <PasskeyEmpty
          isAdding={isAdding}
          onAdd={handleAdd}
          webAuthnAvailable={webAuthnAvailable}
        />
      ) : null}

      {hasPasskeys ? (
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
