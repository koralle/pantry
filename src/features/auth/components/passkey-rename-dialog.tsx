import { Pencil, X } from 'lucide-react'
import { useState } from 'react'
import { Dialog, DialogTrigger, Heading, Modal, ModalOverlay } from 'react-aria-components'

import { StyledButton } from '../../../shared/components/styled-button'
import { StyledInput } from '../../../shared/components/styled-input'
import { StyledLabel } from '../../../shared/components/styled-label'
import { dialog, dialogActions, dialogBackdrop, dialogTitle } from '../../../styles/dialog'
import { field, fieldError } from '../../../styles/form'

export function PasskeyRenameDialog({
  currentName,
  errorMessage,
  inputId,
  isSaving,
  onSave
}: {
  readonly currentName: string
  readonly errorMessage: string | null
  readonly inputId: string
  readonly isSaving: boolean
  readonly onSave: (name: string) => Promise<boolean>
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(currentName)

  return (
    <DialogTrigger
      isOpen={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) {
          setName(currentName)
        }
      }}>
      <StyledButton
        size='sm'
        isDisabled={isSaving}>
        <Pencil
          size={16}
          aria-hidden
        />{' '}
        名前を変更
      </StyledButton>
      <ModalOverlay
        className={dialogBackdrop}
        isDismissable={!isSaving}>
        <Modal className={dialog}>
          <Dialog>
            <Heading
              slot='title'
              className={dialogTitle}>
              表示名を変更
            </Heading>
            <div className={field}>
              <StyledLabel htmlFor={inputId}>表示名</StyledLabel>
              <StyledInput
                id={inputId}
                value={name}
                onChange={(event) => {
                  setName(event.currentTarget.value)
                }}
                autoComplete='off'
                disabled={isSaving}
              />
            </div>
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
                isDisabled={isSaving}>
                <X
                  size={16}
                  aria-hidden
                />{' '}
                キャンセル
              </StyledButton>
              <StyledButton
                visual='accent'
                isDisabled={isSaving || name.trim() === ''}
                onPress={() => {
                  void (async () => {
                    const shouldClose = await onSave(name.trim())
                    if (shouldClose) {
                      setOpen(false)
                    }
                  })()
                }}>
                <Pencil
                  size={16}
                  aria-hidden
                />{' '}
                {isSaving ? '保存中...' : '保存'}
              </StyledButton>
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  )
}
