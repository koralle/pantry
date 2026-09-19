import { CircleAlert, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  Heading,
  Modal,
  ModalOverlay,
  Text,
} from "react-aria-components";

import { IconButton } from "../../../../shared/components/icon-button";
import { StyledButton } from "../../../../shared/components/styled-button";
import {
  dialog,
  dialogActions,
  dialogBackdrop,
  dialogDescription,
  dialogError,
  dialogTitle,
} from "../../../../styles/dialog";

export const PasskeyDeleteDialog = ({
  displayName,
  errorMessage,
  isDeleting,
  isOpen,
  onOpenChange,
  onConfirm,
}: {
  readonly displayName: string;
  readonly errorMessage: string | null;
  readonly isDeleting: boolean;
  readonly isOpen: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: () => void;
}) => (
  <DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
    <IconButton
      aria-label={`「${displayName}」を削除`}
      isDisabled={isDeleting}
      tone="danger"
    >
      <Trash2 size={14} aria-hidden />
    </IconButton>
    <ModalOverlay className={dialogBackdrop} isDismissable={!isDeleting}>
      <Modal className={dialog}>
        <Dialog>
          <Heading slot="title" className={dialogTitle}>
            パスキーを削除しますか？
          </Heading>
          <Text className={dialogDescription} slot="description">
            「{displayName}
            」のパスキーを削除します。この端末ではサインインできなくなります。
          </Text>
          {errorMessage === null || errorMessage === undefined ? null : (
            <p className={dialogError} role="alert">
              <CircleAlert aria-hidden size={12} /> {errorMessage}
            </p>
          )}
          <div className={dialogActions}>
            <StyledButton slot="close" isDisabled={isDeleting} size="sm">
              キャンセル
            </StyledButton>
            <StyledButton
              visual="danger"
              size="sm"
              onPress={onConfirm}
              isPending={isDeleting}
            >
              <Trash2 size={14} aria-hidden />{" "}
              {isDeleting ? "削除中…" : "削除する"}
            </StyledButton>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  </DialogTrigger>
);
