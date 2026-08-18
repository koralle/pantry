import { useNavigate } from '@tanstack/react-router'
import { Trash2, X } from 'lucide-react'
import { useState, useTransition } from 'react'
import { Dialog, DialogTrigger, Heading, Modal, ModalOverlay, Text } from 'react-aria-components'

import { StyledButton } from '../../../shared/components/styled-button'
import { dialog, dialogActions, dialogBackdrop, dialogTitle } from '../../../styles/dialog'
import { fieldError } from '../../../styles/form'
import type { buildListBackSearch } from '../../navigation/lib/bookmark-search-builders'
import { deleteBookmark } from '../functions/delete-bookmark'

export function BookmarkDeleteDialog({
  bookmark,
  listSearch
}: {
  readonly bookmark: { readonly id: string; readonly title: string }
  readonly listSearch: ReturnType<typeof buildListBackSearch>
}) {
  const navigate = useNavigate()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, startDeleteTransition] = useTransition()

  const handleDelete = () => {
    setDeleteError(null)
    startDeleteTransition(async () => {
      try {
        await deleteBookmark({ data: { id: bookmark.id } })
        await navigate({
          to: '/',
          search: listSearch,
          state: { bookmarkDeleted: true }
        })
      } catch (error) {
        setDeleteError(error instanceof Error ? error.message : '削除に失敗しました')
      }
    })
  }

  return (
    <DialogTrigger
      isOpen={deleteOpen}
      onOpenChange={(open) => {
        setDeleteOpen(open)
        if (!open) {
          setDeleteError(null)
        }
      }}>
      <StyledButton
        visual='danger'
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
              このブックマークを削除しますか？
            </Heading>
            <Text slot='description'>
              「{bookmark.title}」を削除します。一覧からは見えなくなります。
            </Text>
            {deleteError ? (
              <p
                className={fieldError}
                role='alert'>
                {deleteError}
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
                onPress={handleDelete}
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
