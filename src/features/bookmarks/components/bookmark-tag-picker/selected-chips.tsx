import { X } from 'lucide-react'

import { StyledButton } from '../../../../shared/components/styled-button'
import type { NamedTag } from './lib'
import { chipButton, selectedRow } from './styles'

type SelectedTagChipsProps = {
  readonly selectedTags: readonly NamedTag[]
  readonly onRemoveTag: (tag: NamedTag) => void
}

export function SelectedTagChips({ selectedTags, onRemoveTag }: SelectedTagChipsProps) {
  if (selectedTags.length === 0) {
    return null
  }

  return (
    <div className={selectedRow}>
      {selectedTags.map((tag) => (
        <StyledButton
          key={tag.id}
          type='button'
          visual='chip'
          className={chipButton}
          aria-label={`${tag.name}を外す`}
          onPress={() => {
            onRemoveTag(tag)
          }}>
          {tag.name}
          <X
            size={14}
            aria-hidden
          />
        </StyledButton>
      ))}
    </div>
  )
}
