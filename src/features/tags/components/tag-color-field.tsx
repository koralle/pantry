import { Check } from "lucide-react";
import { Label, Radio, RadioGroup } from "react-aria-components";
import { css, cx } from "styled-system/css";

import { field } from "../../../styles/form";
import { TAG_COLOR_PALETTE } from "../lib/tag-color-palette";

const NONE_COLOR = "none";

const colorPalette = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "2",
});

const colorSwatch = css({
  _disabled: {
    cursor: "wait",
    opacity: "0.6",
  },
  _focusVisible: {
    outlineColor: "accent.solid",
    outlineOffset: "2px",
    outlineStyle: "solid",
    outlineWidth: "medium",
  },
  _selected: {
    borderColor: "accent.solid",
    boxShadow: "accentRing",
  },
  alignItems: "center",
  blockSize: "11",
  borderColor: "transparent",
  borderRadius: "box",
  borderStyle: "solid",
  borderWidth: "medium",
  cursor: "pointer",
  display: "inline-flex",
  inlineSize: "11",
  justifyContent: "center",
  padding: "0",
});

const colorSwatchClear = css({
  background: "bg.surface",
  backgroundImage:
    "linear-gradient(135deg, transparent 46%, {colors.danger.solid} 46%, {colors.danger.solid} 54%, transparent 54%)",
  borderColor: "border.default",
});

const colorPaletteLegend = css({
  fontWeight: "semibold",
  marginBlockEnd: "1.5",
  padding: "0",
});

interface TagColorFieldProps {
  readonly color: string | null;
  readonly onColorChange: (color: string | null) => void;
  readonly disabled?: boolean;
}

export const TagColorField = ({
  color,
  onColorChange,
  disabled = false,
}: TagColorFieldProps) => (
  <RadioGroup
    className={field}
    value={color ?? NONE_COLOR}
    onChange={(value) => {
      onColorChange(value === NONE_COLOR ? null : value);
    }}
    isDisabled={disabled}
  >
    <Label className={colorPaletteLegend}>色</Label>
    <div className={colorPalette}>
      <Radio
        value={NONE_COLOR}
        className={cx(colorSwatch, colorSwatchClear)}
        aria-label="色なし"
      />
      {TAG_COLOR_PALETTE.map((swatch) => (
        <Radio
          key={swatch}
          value={swatch}
          className={colorSwatch}
          style={{ backgroundColor: swatch }}
          aria-label={`色 ${swatch}`}
        >
          {({ isSelected }) =>
            isSelected ? <Check size={16} color="#fff" aria-hidden /> : null
          }
        </Radio>
      ))}
    </div>
  </RadioGroup>
);
