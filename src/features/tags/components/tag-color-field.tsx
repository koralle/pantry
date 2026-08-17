import { Check } from 'lucide-react'
import { Label, Radio, RadioGroup } from 'react-aria-components'
import { css, cx } from 'styled-system/css'

import { field } from '../../../styles/form'
import { TAG_COLOR_PALETTE } from '../lib/tag-color-palette'

const NONE_COLOR = 'none'

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
  _selected: {
    borderColor: 'accent.solid',
    boxShadow: 'accentRing'
  },
  _focusVisible: {
    outlineWidth: 'medium',
    outlineStyle: 'solid',
    outlineColor: 'accent.solid',
    outlineOffset: '2px'
  },
  _disabled: {
    opacity: '0.6',
    cursor: 'wait'
  }
})

const colorSwatchClear = css({
  background: 'bg.surface',
  borderColor: 'border.default',
  backgroundImage:
    'linear-gradient(135deg, transparent 46%, {colors.danger.solid} 46%, {colors.danger.solid} 54%, transparent 54%)'
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
  return (
    <RadioGroup
      className={field}
      value={color ?? NONE_COLOR}
      onChange={(value) => {
        onColorChange(value === NONE_COLOR ? null : value)
      }}
      isDisabled={disabled}>
      <Label className={colorPaletteLegend}>色</Label>
      <div className={colorPalette}>
        <Radio
          value={NONE_COLOR}
          className={cx(colorSwatch, colorSwatchClear)}
          aria-label='色なし'
        />
        {TAG_COLOR_PALETTE.map((swatch) => (
          <Radio
            key={swatch}
            value={swatch}
            className={colorSwatch}
            style={{ backgroundColor: swatch }}
            aria-label={`色 ${swatch}`}>
            {({ isSelected }) =>
              isSelected ? (
                <Check
                  size={16}
                  color='#fff'
                  aria-hidden
                />
              ) : null
            }
          </Radio>
        ))}
      </div>
    </RadioGroup>
  )
}
