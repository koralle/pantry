import { Check, Minus, Pin, PinOff, Plus } from 'lucide-react'
import { css, cx } from 'styled-system/css'

import { button, field, fieldLabel, formControl } from '../../../styles/ui'
import { TAG_COLOR_PALETTE } from '../tag-color-palette'

const colorPalette = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2'
})

const colorSwatch = css({
  inlineSize: '11',
  blockSize: '11',
  borderRadius: 'box',
  borderWidth: 'medium',
  borderStyle: 'solid',
  borderColor: 'transparent',
  cursor: 'pointer',
  padding: '0',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  _pressed: {
    borderColor: 'accent.solid',
    boxShadow: 'accentRing'
  }
})

const colorSwatchClear = css({
  background: 'bg.surface',
  borderColor: 'border.default',
  backgroundImage:
    'linear-gradient(135deg, transparent 46%, {colors.danger.solid} 46%, {colors.danger.solid} 54%, transparent 54%)'
})

const colorPaletteField = css({
  borderWidth: 'none',
  margin: '0',
  padding: '0',
  minInlineSize: '0'
})

const colorPaletteLegend = css({
  fontWeight: 'semibold',
  padding: '0',
  marginBlockEnd: '1.5'
})

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
      <div className={field}>
        <span
          className={fieldLabel}
          id='tag-pinned-label'>
          ピン留め
        </span>
        <button
          type='button'
          className={button()}
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
        className={cx(field, colorPaletteField)}
        disabled={disabled}>
        <legend className={colorPaletteLegend}>色</legend>
        <div className={colorPalette}>
          <button
            type='button'
            className={cx(colorSwatch, colorSwatchClear)}
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
                className={colorSwatch}
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

      <div className={field}>
        <label
          className={fieldLabel}
          htmlFor='tag-sort-order'>
          並び順
        </label>
        <div className={sortOrderRow}>
          <button
            type='button'
            className={button()}
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
          <button
            type='button'
            className={button()}
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
