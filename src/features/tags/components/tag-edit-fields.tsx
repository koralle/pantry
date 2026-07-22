import { Check, Minus, Pin, PinOff, Plus } from 'lucide-react'

import { TAG_COLOR_PALETTE } from '../tag-color-palette'

type TagEditFieldsProps = {
  readonly pinned: boolean
  readonly color: string | null
  readonly sortOrder: number
  readonly onPinnedChange: (pinned: boolean) => void
  readonly onColorChange: (color: string | null) => void
  readonly onSortOrderChange: (sortOrder: number) => void
  readonly disabled?: boolean
}

function pinLabel(pinned: boolean): string {
  if (pinned) {
    return 'ピン留め中'
  }
  return 'ピン留めする'
}

export function TagEditFields({
  pinned,
  color,
  sortOrder,
  onPinnedChange,
  onColorChange,
  onSortOrderChange,
  disabled = false
}: TagEditFieldsProps) {
  const clearSelected = color === null

  return (
    <>
      <div className='pantry-field'>
        <span id='tag-pinned-label'>ピン留め</span>
        <button
          type='button'
          className='pantry-button pantry-button--secondary'
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
        </button>
      </div>

      <fieldset
        className='pantry-field pantry-color-palette-field'
        disabled={disabled}>
        <legend>色</legend>
        <div className='pantry-color-palette'>
          <button
            type='button'
            className='pantry-color-swatch pantry-color-swatch--clear'
            aria-pressed={clearSelected}
            aria-label='色なし'
            onClick={() => {
              onColorChange(null)
            }}
          />
          {TAG_COLOR_PALETTE.map((swatch) => {
            const selected = color === swatch
            return (
              <button
                key={swatch}
                type='button'
                className='pantry-color-swatch'
                style={{ backgroundColor: swatch }}
                aria-pressed={selected}
                aria-label={`色 ${swatch}`}
                onClick={() => {
                  onColorChange(swatch)
                }}>
                {selected ? (
                  <Check
                    size={16}
                    color='#fff'
                    aria-hidden
                  />
                ) : null}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className='pantry-field'>
        <label htmlFor='tag-sort-order'>並び順</label>
        <div className='pantry-sort-order'>
          <button
            type='button'
            className='pantry-button pantry-button--secondary'
            aria-label='並び順を下げる'
            disabled={disabled}
            onClick={() => {
              onSortOrderChange(sortOrder - 1)
            }}>
            <Minus
              size={16}
              aria-hidden
            />
          </button>
          <input
            id='tag-sort-order'
            type='number'
            value={sortOrder}
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
          <button
            type='button'
            className='pantry-button pantry-button--secondary'
            aria-label='並び順を上げる'
            disabled={disabled}
            onClick={() => {
              onSortOrderChange(sortOrder + 1)
            }}>
            <Plus
              size={16}
              aria-hidden
            />
          </button>
        </div>
      </div>
    </>
  )
}
