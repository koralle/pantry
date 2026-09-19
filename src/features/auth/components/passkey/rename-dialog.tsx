import { Check, Pencil } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  Heading,
  Modal,
  ModalOverlay,
} from "react-aria-components";

import { IconButton } from "../../../../shared/components/icon-button";
import { StyledButton } from "../../../../shared/components/styled-button";
import { StyledInput } from "../../../../shared/components/styled-input";
import { StyledLabel } from "../../../../shared/components/styled-label";
import {
  dialog,
  dialogActions,
  dialogBackdrop,
  dialogError,
  dialogField,
  dialogTitle,
} from "../../../../styles/dialog";

export const PasskeyRenameDialog = ({
  currentName,
  displayName,
  errorMessage,
  inputId,
  isSaving,
  onSave,
}: {
  readonly currentName: string;
  readonly displayName: string;
  readonly errorMessage: string | null;
  readonly inputId: string;
  readonly isSaving: boolean;
  readonly onSave: (name: string) => Promise<boolean>;
}) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);

  return (
    <DialogTrigger
      isOpen={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setName(currentName);
        }
      }}
    >
      <IconButton
        aria-label={`「${displayName}」の表示名を変更`}
        isDisabled={isSaving}
      >
        <Pencil size={14} aria-hidden />
      </IconButton>
      <ModalOverlay className={dialogBackdrop} isDismissable={!isSaving}>
        <Modal className={dialog}>
          <Dialog>
            <Heading slot="title" className={dialogTitle}>
              表示名を変更
            </Heading>
            <div className={dialogField}>
              <StyledLabel htmlFor={inputId}>表示名</StyledLabel>
              <StyledInput
                id={inputId}
                value={name}
                onChange={(event) => {
                  setName(event.currentTarget.value);
                }}
                autoComplete="off"
                disabled={isSaving}
              />
            </div>
            {errorMessage === null || errorMessage === undefined ? null : (
              <p className={dialogError} role="alert">
                {errorMessage}
              </p>
            )}
            <div className={dialogActions}>
              <StyledButton slot="close" isDisabled={isSaving} size="sm">
                キャンセル
              </StyledButton>
              <StyledButton
                visual="accent"
                size="sm"
                isDisabled={isSaving || name.trim() === ""}
                onPress={() => {
                  void (async () => {
                    const shouldClose = await onSave(name.trim());
                    if (shouldClose) {
                      setOpen(false);
                    }
                  })();
                }}
              >
                <Check size={14} aria-hidden /> {isSaving ? "保存中…" : "保存"}
              </StyledButton>
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
};
