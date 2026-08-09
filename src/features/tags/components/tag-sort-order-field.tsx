import { Minus, Plus } from 'lucide-react'
import { css, cx } from 'styled-system/css'

import { StyledButton } from '../../../shared/components/styled-button'
import { field, fieldLabel, formControl } from '../../../styles/form'

const sortOrderRow = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
  alignItems: 'center'
})

const sortOrderInput = cx(
  formControl,
  css({
    inlineSize: '20',
    fontVariantNumeric: 'tabular-nums'
  })
)

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
    <div className={field}>
      <label
        className={fieldLabel}
        htmlFor='tag-sort-order'>
        並び順
      </label>
      <div className={sortOrderRow}>
        <StyledButton
          aria-label='並び順を下げる'
          isDisabled={disabled}
          onPress={() => {
            onSortOrderChange(sortOrder - 1)
          }}>
          <Minus
            size={16}
            aria-hidden
          />
        </StyledButton>
        <input
          className={sortOrderInput}
          id='tag-sort-order'
          type='number'
          value={String(sortOrder)}
          disabled={disabled}
          onChange={(event) => {
            const next = Number(event.target.value)
            if (Number.isFinite(next)) {
              onSortOrderChange(next)
              return
            }
            onSortOrderChange(0)
          }}
        />
        <StyledButton
          aria-label='並び順を上げる'
          isDisabled={disabled}
          onPress={() => {
            onSortOrderChange(sortOrder + 1)
          }}>
          <Plus
            size={16}
            aria-hidden
          />
        </StyledButton>
      </div>
    </div>
  )
}
