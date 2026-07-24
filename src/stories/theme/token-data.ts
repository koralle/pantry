/**
 * Token catalogs sourced from `panda.config.ts` theme.extend
 * (plus Panda defaults used by the project for spacing / shared scales).
 */
import type { Token } from 'styled-system/tokens'

export type TokenEntry = {
  readonly path: Token
  readonly label: string
}

export const pantryColors = [
  { path: 'colors.pantry.canvas', label: 'pantry.canvas' },
  { path: 'colors.pantry.ink', label: 'pantry.ink' },
  { path: 'colors.pantry.muted', label: 'pantry.muted' },
  { path: 'colors.pantry.line', label: 'pantry.line' },
  { path: 'colors.pantry.accent', label: 'pantry.accent' },
  { path: 'colors.pantry.surface', label: 'pantry.surface' },
  { path: 'colors.pantry.danger', label: 'pantry.danger' }
] as const satisfies readonly TokenEntry[]

export const semanticColors = [
  { path: 'colors.bg.canvas', label: 'bg.canvas' },
  { path: 'colors.bg.surface', label: 'bg.surface' },
  { path: 'colors.fg.default', label: 'fg.default' },
  { path: 'colors.fg.muted', label: 'fg.muted' },
  { path: 'colors.border.default', label: 'border.default' },
  { path: 'colors.border.accent', label: 'border.accent' },
  { path: 'colors.border.danger', label: 'border.danger' },
  { path: 'colors.accent.solid', label: 'accent.solid' },
  { path: 'colors.accent.subtle', label: 'accent.subtle' },
  { path: 'colors.accent.fg', label: 'accent.fg' },
  { path: 'colors.danger.solid', label: 'danger.solid' },
  { path: 'colors.danger.surface', label: 'danger.surface' },
  { path: 'colors.danger.border', label: 'danger.border' },
  { path: 'colors.surface.header', label: 'surface.header' },
  { path: 'colors.surface.rail', label: 'surface.rail' },
  { path: 'colors.surface.tag', label: 'surface.tag' },
  { path: 'colors.overlay.backdrop', label: 'overlay.backdrop' },
  { path: 'colors.skeleton.start', label: 'skeleton.start' },
  { path: 'colors.skeleton.middle', label: 'skeleton.middle' }
] as const satisfies readonly TokenEntry[]

export const fontTokens = [
  { path: 'fonts.body', label: 'body' },
  { path: 'fonts.sans', label: 'sans' },
  { path: 'fonts.serif', label: 'serif' },
  { path: 'fonts.mono', label: 'mono' }
] as const satisfies readonly TokenEntry[]

/** Project-extended font sizes from panda.config.ts, then useful defaults. */
export const fontSizeTokens = [
  { path: 'fontSizes.2xs', label: '2xs' },
  { path: 'fontSizes.xs2', label: 'xs2' },
  { path: 'fontSizes.xs', label: 'xs' },
  { path: 'fontSizes.sm', label: 'sm' },
  { path: 'fontSizes.md2', label: 'md2' },
  { path: 'fontSizes.md', label: 'md' },
  { path: 'fontSizes.lg', label: 'lg' },
  { path: 'fontSizes.xl', label: 'xl' },
  { path: 'fontSizes.2xl', label: '2xl' },
  { path: 'fontSizes.3xl', label: '3xl' },
  { path: 'fontSizes.4xl', label: '4xl' },
  { path: 'fontSizes.title', label: 'title' }
] as const satisfies readonly TokenEntry[]

export const lineHeightTokens = [
  { path: 'lineHeights.body', label: 'body' },
  { path: 'lineHeights.tight', label: 'tight' },
  { path: 'lineHeights.relaxed', label: 'relaxed' },
  { path: 'lineHeights.none', label: 'none' },
  { path: 'lineHeights.snug', label: 'snug' },
  { path: 'lineHeights.normal', label: 'normal' },
  { path: 'lineHeights.loose', label: 'loose' }
] as const satisfies readonly TokenEntry[]

export const fontWeightTokens = [
  { path: 'fontWeights.thin', label: 'thin' },
  { path: 'fontWeights.extralight', label: 'extralight' },
  { path: 'fontWeights.light', label: 'light' },
  { path: 'fontWeights.normal', label: 'normal' },
  { path: 'fontWeights.medium', label: 'medium' },
  { path: 'fontWeights.semibold', label: 'semibold' },
  { path: 'fontWeights.bold', label: 'bold' },
  { path: 'fontWeights.extrabold', label: 'extrabold' },
  { path: 'fontWeights.black', label: 'black' }
] as const satisfies readonly TokenEntry[]

/** Positive spacing scale (Panda defaults; project does not extend spacing). */
export const spacingTokens = [
  { path: 'spacing.0', label: '0' },
  { path: 'spacing.0.5', label: '0.5' },
  { path: 'spacing.1', label: '1' },
  { path: 'spacing.1.5', label: '1.5' },
  { path: 'spacing.2', label: '2' },
  { path: 'spacing.2.5', label: '2.5' },
  { path: 'spacing.3', label: '3' },
  { path: 'spacing.3.5', label: '3.5' },
  { path: 'spacing.4', label: '4' },
  { path: 'spacing.4.5', label: '4.5' },
  { path: 'spacing.5', label: '5' },
  { path: 'spacing.5.5', label: '5.5' },
  { path: 'spacing.6', label: '6' },
  { path: 'spacing.7', label: '7' },
  { path: 'spacing.8', label: '8' },
  { path: 'spacing.9', label: '9' },
  { path: 'spacing.10', label: '10' },
  { path: 'spacing.11', label: '11' },
  { path: 'spacing.12', label: '12' },
  { path: 'spacing.14', label: '14' },
  { path: 'spacing.16', label: '16' },
  { path: 'spacing.20', label: '20' },
  { path: 'spacing.24', label: '24' },
  { path: 'spacing.28', label: '28' },
  { path: 'spacing.32', label: '32' },
  { path: 'spacing.36', label: '36' },
  { path: 'spacing.40', label: '40' },
  { path: 'spacing.44', label: '44' },
  { path: 'spacing.48', label: '48' },
  { path: 'spacing.52', label: '52' },
  { path: 'spacing.56', label: '56' },
  { path: 'spacing.60', label: '60' },
  { path: 'spacing.64', label: '64' },
  { path: 'spacing.72', label: '72' },
  { path: 'spacing.80', label: '80' },
  { path: 'spacing.96', label: '96' }
] as const satisfies readonly TokenEntry[]

/** Project-extended sizes from panda.config.ts. */
export const customSizeTokens = [
  { path: 'sizes.touch', label: 'touch' },
  { path: 'sizes.5.5', label: '5.5' },
  { path: 'sizes.11', label: '11' },
  { path: 'sizes.22', label: '22' },
  { path: 'sizes.4rem', label: '4rem' },
  { path: 'sizes.4.5rem', label: '4.5rem' },
  { path: 'sizes.5.5rem', label: '5.5rem' },
  { path: 'sizes.12rem', label: '12rem' },
  { path: 'sizes.16rem', label: '16rem' },
  { path: 'sizes.18rem', label: '18rem' },
  { path: 'sizes.22rem', label: '22rem' },
  { path: 'sizes.24rem', label: '24rem' },
  { path: 'sizes.28rem', label: '28rem' },
  { path: 'sizes.36rem', label: '36rem' },
  { path: 'sizes.42rem', label: '42rem' },
  { path: 'sizes.48rem', label: '48rem' },
  { path: 'sizes.min-10', label: 'min-10' },
  { path: 'sizes.min-12', label: 'min-12' },
  { path: 'sizes.min-18', label: 'min-18' },
  { path: 'sizes.min-22', label: 'min-22' },
  { path: 'sizes.100dvh', label: '100dvh' },
  { path: 'sizes.100dvb', label: '100dvb' },
  { path: 'sizes.85dvh', label: '85dvh' },
  { path: 'sizes.dialog-width', label: 'dialog-width' },
  { path: 'sizes.fit', label: 'fit' }
] as const satisfies readonly TokenEntry[]

export const radiusTokens = [
  { path: 'radii.xs', label: 'xs' },
  { path: 'radii.sm', label: 'sm' },
  { path: 'radii.md', label: 'md' },
  { path: 'radii.lg', label: 'lg' },
  { path: 'radii.xl', label: 'xl' },
  { path: 'radii.2xl', label: '2xl' },
  { path: 'radii.3xl', label: '3xl' },
  { path: 'radii.4xl', label: '4xl' },
  { path: 'radii.box', label: 'box' },
  { path: 'radii.sheet', label: 'sheet' },
  { path: 'radii.full', label: 'full' }
] as const satisfies readonly TokenEntry[]

export const borderWidthTokens = [
  { path: 'borderWidths.none', label: 'none' },
  { path: 'borderWidths.thin', label: 'thin' },
  { path: 'borderWidths.medium', label: 'medium' },
  { path: 'borderWidths.thick', label: 'thick' }
] as const satisfies readonly TokenEntry[]

export const shadowTokens = [
  { path: 'shadows.2xs', label: '2xs' },
  { path: 'shadows.xs', label: 'xs' },
  { path: 'shadows.sm', label: 'sm' },
  { path: 'shadows.md', label: 'md' },
  { path: 'shadows.lg', label: 'lg' },
  { path: 'shadows.xl', label: 'xl' },
  { path: 'shadows.2xl', label: '2xl' },
  { path: 'shadows.accentRing', label: 'accentRing' }
] as const satisfies readonly TokenEntry[]

export const durationTokens = [
  { path: 'durations.fastest', label: 'fastest' },
  { path: 'durations.faster', label: 'faster' },
  { path: 'durations.fast', label: 'fast' },
  { path: 'durations.normal', label: 'normal' },
  { path: 'durations.slow', label: 'slow' },
  { path: 'durations.slower', label: 'slower' },
  { path: 'durations.slowest', label: 'slowest' },
  { path: 'durations.skeleton', label: 'skeleton' },
  { path: 'durations.spin', label: 'spin' },
  { path: 'durations.fadeUp', label: 'fadeUp' },
  { path: 'durations.crossfade', label: 'crossfade' }
] as const satisfies readonly TokenEntry[]

export const easingTokens = [
  { path: 'easings.default', label: 'default' },
  { path: 'easings.linear', label: 'linear' },
  { path: 'easings.in', label: 'in' },
  { path: 'easings.out', label: 'out' },
  { path: 'easings.in-out', label: 'in-out' }
] as const satisfies readonly TokenEntry[]

export const aspectRatioTokens = [
  { path: 'aspectRatios.square', label: 'square' },
  { path: 'aspectRatios.landscape', label: 'landscape' },
  { path: 'aspectRatios.portrait', label: 'portrait' },
  { path: 'aspectRatios.wide', label: 'wide' },
  { path: 'aspectRatios.ultrawide', label: 'ultrawide' },
  { path: 'aspectRatios.golden', label: 'golden' }
] as const satisfies readonly TokenEntry[]

export const breakpointTokens = [
  { path: 'breakpoints.sm', label: 'sm' },
  { path: 'breakpoints.md', label: 'md' },
  { path: 'breakpoints.lg', label: 'lg' },
  { path: 'breakpoints.xl', label: 'xl' },
  { path: 'breakpoints.2xl', label: '2xl' }
] as const satisfies readonly TokenEntry[]

export const animationStyleNames = ['skeleton', 'fadeUp', 'crossfade'] as const
