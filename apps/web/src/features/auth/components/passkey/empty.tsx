import { KeyRound, Plus } from "lucide-react";

import { StyledButton } from "../../../../shared/components/styled-button";
import {
  passkeyEmpty,
  passkeyEmptyAction,
  passkeyEmptyIcon,
  passkeyEmptyNote,
  passkeyEmptyTitle,
} from "../../styles";

/** パスキー未登録時の案内。WebAuthn が使える環境でのみ登録導線を出す。 */
export const PasskeyEmpty = ({
  isAdding,
  onAdd,
  webAuthnAvailable,
}: {
  readonly isAdding: boolean;
  readonly onAdd: () => void;
  readonly webAuthnAvailable: boolean;
}) => (
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
          onPress={onAdd}
          size="sm"
          visual="accent"
        >
          <Plus size={13} aria-hidden />{" "}
          {isAdding ? "登録中…" : "パスキーを登録"}
        </StyledButton>
      </div>
    ) : null}
  </div>
);
