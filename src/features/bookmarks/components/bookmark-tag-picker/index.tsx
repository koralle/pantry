import { Dialog, DialogTrigger, Heading, Modal, ModalOverlay, Popover } from 'react-aria-components'

import { StyledButton } from '../../../../shared/components/styled-button'
import { field, fieldError, fieldLabel } from '../../../../styles/form'
import { TagPickerPanel } from './panel'
import { SelectedTagChips } from './selected-chips'
import { popover, sheet, sheetBackdrop, sheetHeader, sheetTitle, statusMessage } from './styles'
import type { BookmarkTagPickerProps } from './types'
import { useDesktopTagPicker } from './use-desktop-tag-picker'

export type { NamedTag } from './lib'
export type { TagCandidate } from './types'
export { canOfferCreateTag, filterTagCandidates, toggleSelectedTag } from './lib'

export function BookmarkTagPicker({
  selectedTags,
  tagCandidates,
  tagsReady,
  query,
  onQueryChange,
  isOpen,
  onOpenChange,
  onToggleTag,
  onRemoveTag,
  onCreateTag,
  isCreatingTag,
  createError,
  serverError,
  canCreate,
  createLabel
}: BookmarkTagPickerProps) {
  const isDesktop = useDesktopTagPicker()
  const fieldErrorMessage = serverError ?? createError
  const describedBy = [
    isCreatingTag ? 'bookmark-tag-creating' : null,
    fieldErrorMessage !== null && fieldErrorMessage !== undefined ? 'bookmark-tag-error' : null
  ]
    .filter((id): id is string => id !== null)
    .join(' ')

  const panel = (
    <TagPickerPanel
      tagCandidates={tagCandidates}
      selectedTags={selectedTags}
      query={query}
      onQueryChange={onQueryChange}
      onToggleTag={onToggleTag}
      onCreateTag={onCreateTag}
      tagsReady={tagsReady}
      isCreatingTag={isCreatingTag}
      canCreate={canCreate}
      createLabel={createLabel}
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
        isOpen={isOpen}
        onOpenChange={onOpenChange}>
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
