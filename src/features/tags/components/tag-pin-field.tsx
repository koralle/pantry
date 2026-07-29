import { Pin, PinOff } from 'lucide-react'

import { StyledButton } from '../../../shared/components/styled-button'
import { field, fieldLabel } from '../../../styles/form'

type TagPinFieldProps = {
  readonly pinned: boolean
  readonly onPinnedChange: (pinned: boolean) => void
  readonly disabled?: boolean
}

function pinLabel(pinned: boolean): string {
  if (pinned) {
    return 'ピン留め中'
  }
  return 'ピン留めする'
}

export function TagPinField({ pinned, onPinnedChange, disabled = false }: TagPinFieldProps) {
  return (
    <div className={field}>
      <span
        className={fieldLabel}
        id='tag-pinned-label'>
        ピン留め
      </span>
      <StyledButton
        aria-pressed={pinned}
        aria-labelledby='tag-pinned-label'
        disabled={disabled}
        onClick={() => {
          onPinnedChange(!pinned)
        }}>
        {pinned ? (
          <PinOff
            size={16}
            aria-hidden
          />
        ) : (
          <Pin
            size={16}
            aria-hidden
          />
        )}{' '}
        {pinLabel(pinned)}
      </StyledButton>
    </div>
  )
}
