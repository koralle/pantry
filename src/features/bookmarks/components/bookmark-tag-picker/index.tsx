import { useEffect, useState, useSyncExternalStore } from 'react'
import { Dialog, DialogTrigger, Heading, Modal, ModalOverlay, Popover } from 'react-aria-components'

import { StyledButton } from '../../../../shared/components/styled-button'
import { field, fieldError, fieldLabel } from '../../../../styles/form'
import type { NamedTag, TagCandidate } from './lib'
import { TagPickerPanel } from './panel'
import { SelectedTagChips } from './selected-chips'
import { popover, sheet, sheetBackdrop, sheetHeader, sheetTitle, statusMessage } from './styles'

export type { TagCandidate } from './lib'

const desktopQuery = '(min-width: 768px)'

function subscribeDesktop(onStoreChange: () => void): () => void {
  const media = globalThis.matchMedia(desktopQuery)
  media.addEventListener('change', onStoreChange)
  return () => {
    media.removeEventListener('change', onStoreChange)
  }
}

type BookmarkTagPickerProps = {
  readonly selectedTags: readonly NamedTag[]
  readonly tagCandidates: readonly TagCandidate[]
  readonly tagsReady: boolean
  readonly onToggleTag: (tag: NamedTag) => void
  readonly onRemoveTag: (tag: NamedTag) => void
  readonly onCreateTag: (name: string) => void
  readonly isCreatingTag: boolean
  readonly lastCreatedTagId: number | null
  readonly createError: string | null
  readonly serverError: string | undefined
}

export function BookmarkTagPicker({
  selectedTags,
  tagCandidates,
  tagsReady,
  onToggleTag,
  onRemoveTag,
  onCreateTag,
  isCreatingTag,
  lastCreatedTagId,
  createError,
  serverError
}: BookmarkTagPickerProps) {
  const [query, setQuery] = useState('')
  const isDesktop = useSyncExternalStore(
    subscribeDesktop,
    () => globalThis.matchMedia(desktopQuery).matches,
    () => true
  )
  const fieldErrorMessage = serverError ?? createError
  const describedBy = [
    isCreatingTag ? 'bookmark-tag-creating' : null,
    fieldErrorMessage !== null && fieldErrorMessage !== undefined ? 'bookmark-tag-error' : null
  ]
    .filter((id): id is string => id !== null)
    .join(' ')

  useEffect(() => {
    if (lastCreatedTagId === null) {
      return
    }
    setQuery('')
  }, [lastCreatedTagId])

  const panel = (
    <TagPickerPanel
      tagCandidates={tagCandidates}
      selectedTags={selectedTags}
      query={query}
      onQueryChange={setQuery}
      onToggleTag={onToggleTag}
      onCreateTag={onCreateTag}
      tagsReady={tagsReady}
      isCreatingTag={isCreatingTag}
      listMaxHeight={isDesktop ? 'popover' : 'sheet'}
    />
  )

  return (
    <fieldset
      className={field}
      aria-describedby={describedBy === '' ? undefined : describedBy}
      aria-busy={isCreatingTag || undefined}>
      <legend className={fieldLabel}>タグ</legend>
      <SelectedTagChips
        selectedTags={selectedTags}
        onRemoveTag={onRemoveTag}
      />
      {isCreatingTag ? (
        <output
          id='bookmark-tag-creating'
          className={statusMessage}>
          タグを作成中です。完了するまで保存を開始できません。
        </output>
      ) : null}
      {fieldErrorMessage !== undefined && fieldErrorMessage !== null && fieldErrorMessage !== '' ? (
        <p
          id='bookmark-tag-error'
          className={fieldError}
          role='alert'>
          {fieldErrorMessage}
        </p>
      ) : null}
      <DialogTrigger
        onOpenChange={(open) => {
          if (!open) {
            setQuery('')
          }
        }}>
        <StyledButton type='button'>タグを選ぶ</StyledButton>
        {isDesktop ? (
          <Popover
            placement='bottom start'
            offset={4}
            className={popover}
            isNonModal>
            <Dialog aria-label='タグを選ぶ'>{panel}</Dialog>
          </Popover>
        ) : (
          <ModalOverlay
            isDismissable
            className={sheetBackdrop}>
            <Modal className={sheet}>
              <Dialog>
                <div className={sheetHeader}>
                  <Heading
                    slot='title'
                    className={sheetTitle}>
                    タグを選ぶ
                  </Heading>
                  <StyledButton
                    slot='close'
                    type='button'>
                    完了
                  </StyledButton>
                </div>
                {panel}
              </Dialog>
            </Modal>
          </ModalOverlay>
        )}
      </DialogTrigger>
    </fieldset>
  )
}
