/** Fixed swatches for tag color pickers (not free-form hex entry). */
export const TAG_COLOR_PALETTE = [
  '#2f6f6a',
  '#4a6fa5',
  '#6b7c4c',
  '#a67c52',
  '#8b5e6b',
  '#5c6b73',
  '#b0855a',
  '#3d6b5a'
] as const

export type TagPaletteColor = (typeof TAG_COLOR_PALETTE)[number]
