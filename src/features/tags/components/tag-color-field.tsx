import { Check } from 'lucide-react'
import { css, cx } from 'styled-system/css'

import { field } from '../../../styles/form'
import { TAG_COLOR_PALETTE } from '../lib/tag-color-palette'

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

type TagColorFieldProps = {
  readonly color: string | null
  readonly onColorChange: (color: string | null) => void
  readonly disabled?: boolean
}

export function TagColorField({ color, onColorChange, disabled = false }: TagColorFieldProps) {
  const clearSelected = color === null

  return (
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
  )
}
