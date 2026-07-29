import { Dialog } from '@base-ui/react/dialog'
import { useNavigate } from '@tanstack/react-router'
import { Trash2, X } from 'lucide-react'
import { useState, useTransition } from 'react'

import { StyledButton } from '../../../shared/components/styled-button'
import { button } from '../../../styles/button'
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
    <Dialog.Root
      open={deleteOpen}
      onOpenChange={(open) => {
        setDeleteOpen(open)
        if (!open) {
          setDeleteError(null)
        }
      }}>
      <Dialog.Trigger
        className={button({ visual: 'danger' })}
        disabled={isDeleting}>
        <Trash2
          size={16}
          aria-hidden
        />{' '}
        削除
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={dialogBackdrop} />
        <Dialog.Popup className={dialog}>
          <Dialog.Title className={dialogTitle}>このブックマークを削除しますか？</Dialog.Title>
          <Dialog.Description>
            「{bookmark.title}」を削除します。一覧からは見えなくなります。
          </Dialog.Description>
          {deleteError ? (
            <p
              className={fieldError}
              role='alert'>
              {deleteError}
            </p>
          ) : null}
          <div className={dialogActions}>
            <Dialog.Close
              className={button()}
              disabled={isDeleting}>
              <X
                size={16}
                aria-hidden
              />{' '}
              キャンセル
            </Dialog.Close>
            <StyledButton
              visual='danger'
              onClick={handleDelete}
              disabled={isDeleting}>
              <Trash2
                size={16}
                aria-hidden
              />{' '}
              {isDeleting ? '削除中…' : '削除を確認'}
            </StyledButton>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
