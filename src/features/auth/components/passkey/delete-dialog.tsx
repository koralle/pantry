import { Trash2, X } from 'lucide-react'
import { Dialog, DialogTrigger, Heading, Modal, ModalOverlay, Text } from 'react-aria-components'

import { StyledButton } from '../../../../shared/components/styled-button'
import { dialog, dialogActions, dialogBackdrop, dialogTitle } from '../../../../styles/dialog'
import { fieldError } from '../../../../styles/form'

export function PasskeyDeleteDialog({
  displayName,
  errorMessage,
  isDeleting,
  isOpen,
  onOpenChange,
  onConfirm
}: {
  readonly displayName: string
  readonly errorMessage: string | null
  readonly isDeleting: boolean
  readonly isOpen: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onConfirm: () => void
}) {
  return (
    <DialogTrigger
      isOpen={isOpen}
      onOpenChange={onOpenChange}>
      <StyledButton
        visual='danger'
        size='sm'
        isDisabled={isDeleting}>
        <Trash2
          size={16}
          aria-hidden
        />{' '}
        削除
      </StyledButton>
      <ModalOverlay
        className={dialogBackdrop}
        isDismissable={!isDeleting}>
        <Modal className={dialog}>
          <Dialog>
            <Heading
              slot='title'
              className={dialogTitle}>
              このパスキーを削除しますか？
            </Heading>
            <Text slot='description'>
              「{displayName}」を削除します。削除すると、このパスキーではログインできなくなります。
            </Text>
            {errorMessage != null ? (
              <p
                className={fieldError}
                role='alert'>
                {errorMessage}
              </p>
            ) : null}
            <div className={dialogActions}>
              <StyledButton
                slot='close'
                isDisabled={isDeleting}>
                <X
                  size={16}
                  aria-hidden
                />{' '}
                キャンセル
              </StyledButton>
              <StyledButton
                visual='danger'
                onPress={onConfirm}
                isDisabled={isDeleting}>
                <Trash2
                  size={16}
                  aria-hidden
                />{' '}
                {isDeleting ? '削除中…' : '削除を確認'}
              </StyledButton>
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  )
}
