import { Minus, Plus } from 'lucide-react'
import { Group, Label, NumberField } from 'react-aria-components'
import { css } from 'styled-system/css'

import { StyledButton } from '../../../shared/components/styled-button'
import { StyledInput } from '../../../shared/components/styled-input'
import { field, fieldLabel } from '../../../styles/form'

const sortOrderRow = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
  alignItems: 'center'
})

type TagSortOrderFieldProps = {
  readonly sortOrder: number
  readonly onSortOrderChange: (sortOrder: number) => void
  readonly disabled?: boolean
}

export function TagSortOrderField({
  sortOrder,
  onSortOrderChange,
  disabled = false
}: TagSortOrderFieldProps) {
  return (
    <NumberField
      className={field}
      value={sortOrder}
      onChange={(value) => {
        onSortOrderChange(Number.isFinite(value) ? value : 0)
      }}
      isDisabled={disabled}>
      <Label className={fieldLabel}>並び順</Label>
      <Group className={sortOrderRow}>
        <StyledButton
          slot='decrement'
          aria-label='並び順を下げる'>
          <Minus
            size={16}
            aria-hidden
          />
        </StyledButton>
        <StyledInput
          width='auto'
          inlineSize='20'
          fontVariantNumeric='tabular-nums'
        />
        <StyledButton
          slot='increment'
          aria-label='並び順を上げる'>
          <Plus
            size={16}
            aria-hidden
          />
        </StyledButton>
      </Group>
    </NumberField>
  )
}
