import { useState } from 'react'
import { css } from 'styled-system/css'

import { authClient } from '../lib/auth-client'
import { formatPasskeyCreatedAt } from '../lib/format-passkey-created-at'
import { passkeyDisplayName } from '../lib/passkey-display-name'
import { getPasskeyManageErrorMessage } from '../lib/passkey-messages'
import { PasskeyDeleteDialog } from './passkey-delete-dialog'
import { PasskeyRenameDialog } from './passkey-rename-dialog'

export type ManagedPasskey = {
  readonly id: string
  readonly name?: string | null
  readonly aaguid?: string | null
  readonly createdAt: string | Date
}

const passkeyItem = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  paddingBlock: '3',
  borderBlockEndWidth: 'thin',
  borderBlockEndStyle: 'solid',
  borderBlockEndColor: 'border.default'
})

const passkeyItemName = css({
  margin: '0',
  fontSize: 'md',
  fontWeight: 'semibold',
  overflowWrap: 'anywhere'
})

const passkeyItemMeta = css({
  margin: '0',
  color: 'fg.muted',
  fontSize: 'xs'
})

const passkeyItemActions = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2'
})

export function PasskeyListItem({
  passkey,
  onMutated
}: {
  readonly passkey: ManagedPasskey
  readonly onMutated: (message: string) => void
}) {
  const displayName = passkeyDisplayName(passkey)
  const [renameError, setRenameError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleRename = async (name: string) => {
    setRenameError(null)
    setIsRenaming(true)
    try {
      const { error } = await authClient.passkey.updatePasskey({
        id: passkey.id,
        name
      })
      if (error != null) {
        setRenameError(getPasskeyManageErrorMessage(error))
        return false
      }
      onMutated('表示名を変更しました')
      return true
    } catch {
      setRenameError(getPasskeyManageErrorMessage({}))
      return false
    } finally {
      setIsRenaming(false)
    }
  }

  const handleDelete = () => {
    setDeleteError(null)
    setIsDeleting(true)
    void (async () => {
      try {
        const { error } = await authClient.passkey.deletePasskey({ id: passkey.id })
        if (error != null) {
          setDeleteError(getPasskeyManageErrorMessage(error))
          return
        }
        setDeleteOpen(false)
        onMutated('パスキーを削除しました')
      } catch {
        setDeleteError(getPasskeyManageErrorMessage({}))
      } finally {
        setIsDeleting(false)
      }
    })()
  }

  return (
    <article
      className={passkeyItem}
      aria-label={displayName}>
      <p className={passkeyItemName}>{displayName}</p>
      <p className={passkeyItemMeta}>登録日時 {formatPasskeyCreatedAt(passkey.createdAt)}</p>
      <div className={passkeyItemActions}>
        <PasskeyRenameDialog
          currentName={passkey.name?.trim() ?? ''}
          errorMessage={renameError}
          inputId={`passkey-display-name-${passkey.id}`}
          isSaving={isRenaming}
          onSave={handleRename}
        />
        <PasskeyDeleteDialog
          displayName={displayName}
          errorMessage={deleteError}
          isDeleting={isDeleting}
          isOpen={deleteOpen}
          onOpenChange={(open) => {
            setDeleteOpen(open)
            if (!open) {
              setDeleteError(null)
            }
          }}
          onConfirm={handleDelete}
        />
      </div>
    </article>
  )
}
