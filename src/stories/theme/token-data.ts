/**
 * Token catalogs sourced from `panda.config.ts` theme.extend
 * (plus Panda defaults used by the project for spacing / shared scales).
 */
import type { Token } from "styled-system/tokens";

export interface TokenEntry {
  readonly path: Token;
  readonly label: string;
}

export const pantryColors = [
  { label: "pantry.canvas", path: "colors.pantry.canvas" },
  { label: "pantry.ink", path: "colors.pantry.ink" },
  { label: "pantry.muted", path: "colors.pantry.muted" },
  { label: "pantry.line", path: "colors.pantry.line" },
  { label: "pantry.accent", path: "colors.pantry.accent" },
  { label: "pantry.surface", path: "colors.pantry.surface" },
  { label: "pantry.danger", path: "colors.pantry.danger" },
] as const satisfies readonly TokenEntry[];

export const semanticColors = [
  { label: "bg.canvas", path: "colors.bg.canvas" },
  { label: "bg.surface", path: "colors.bg.surface" },
  { label: "fg.default", path: "colors.fg.default" },
  { label: "fg.muted", path: "colors.fg.muted" },
  { label: "border.default", path: "colors.border.default" },
  { label: "border.accent", path: "colors.border.accent" },
  { label: "border.danger", path: "colors.border.danger" },
  { label: "accent.solid", path: "colors.accent.solid" },
  { label: "accent.solidHover", path: "colors.accent.solidHover" },
  { label: "accent.subtle", path: "colors.accent.subtle" },
  { label: "accent.hover", path: "colors.accent.hover" },
  { label: "accent.fg", path: "colors.accent.fg" },
  { label: "danger.solid", path: "colors.danger.solid" },
  { label: "danger.surface", path: "colors.danger.surface" },
  { label: "danger.border", path: "colors.danger.border" },
  { label: "surface.header", path: "colors.surface.header" },
  { label: "surface.rail", path: "colors.surface.rail" },
  { label: "surface.tag", path: "colors.surface.tag" },
  { label: "overlay.backdrop", path: "colors.overlay.backdrop" },
  { label: "skeleton.start", path: "colors.skeleton.start" },
  { label: "skeleton.middle", path: "colors.skeleton.middle" },
] as const satisfies readonly TokenEntry[];

export const fontTokens = [
  { label: "body", path: "fonts.body" },
  { label: "sans", path: "fonts.sans" },
  { label: "serif", path: "fonts.serif" },
  { label: "mono", path: "fonts.mono" },
] as const satisfies readonly TokenEntry[];

/** Project-extended font sizes from panda.config.ts, then useful defaults. */
export const fontSizeTokens = [
  { label: "2xs", path: "fontSizes.2xs" },
  { label: "xs2", path: "fontSizes.xs2" },
  { label: "xs", path: "fontSizes.xs" },
  { label: "sm", path: "fontSizes.sm" },
  { label: "md2", path: "fontSizes.md2" },
  { label: "md", path: "fontSizes.md" },
  { label: "lg", path: "fontSizes.lg" },
  { label: "xl", path: "fontSizes.xl" },
  { label: "2xl", path: "fontSizes.2xl" },
  { label: "3xl", path: "fontSizes.3xl" },
  { label: "4xl", path: "fontSizes.4xl" },
  { label: "title", path: "fontSizes.title" },
] as const satisfies readonly TokenEntry[];

export const lineHeightTokens = [
  { label: "body", path: "lineHeights.body" },
  { label: "tight", path: "lineHeights.tight" },
  { label: "relaxed", path: "lineHeights.relaxed" },
  { label: "none", path: "lineHeights.none" },
  { label: "snug", path: "lineHeights.snug" },
  { label: "normal", path: "lineHeights.normal" },
  { label: "loose", path: "lineHeights.loose" },
] as const satisfies readonly TokenEntry[];

export const fontWeightTokens = [
  { label: "thin", path: "fontWeights.thin" },
  { label: "extralight", path: "fontWeights.extralight" },
  { label: "light", path: "fontWeights.light" },
  { label: "normal", path: "fontWeights.normal" },
  { label: "medium", path: "fontWeights.medium" },
  { label: "semibold", path: "fontWeights.semibold" },
  { label: "bold", path: "fontWeights.bold" },
  { label: "extrabold", path: "fontWeights.extrabold" },
  { label: "black", path: "fontWeights.black" },
] as const satisfies readonly TokenEntry[];

/** Positive spacing scale (Panda defaults; project does not extend spacing). */
export const spacingTokens = [
  { label: "0", path: "spacing.0" },
  { label: "0.5", path: "spacing.0.5" },
  { label: "1", path: "spacing.1" },
  { label: "1.5", path: "spacing.1.5" },
  { label: "2", path: "spacing.2" },
  { label: "2.5", path: "spacing.2.5" },
  { label: "3", path: "spacing.3" },
  { label: "3.5", path: "spacing.3.5" },
  { label: "4", path: "spacing.4" },
  { label: "4.5", path: "spacing.4.5" },
  { label: "5", path: "spacing.5" },
  { label: "5.5", path: "spacing.5.5" },
  { label: "6", path: "spacing.6" },
  { label: "7", path: "spacing.7" },
  { label: "8", path: "spacing.8" },
  { label: "9", path: "spacing.9" },
  { label: "10", path: "spacing.10" },
  { label: "11", path: "spacing.11" },
  { label: "12", path: "spacing.12" },
  { label: "14", path: "spacing.14" },
  { label: "16", path: "spacing.16" },
  { label: "20", path: "spacing.20" },
  { label: "24", path: "spacing.24" },
  { label: "28", path: "spacing.28" },
  { label: "32", path: "spacing.32" },
  { label: "36", path: "spacing.36" },
  { label: "40", path: "spacing.40" },
  { label: "44", path: "spacing.44" },
  { label: "48", path: "spacing.48" },
  { label: "52", path: "spacing.52" },
  { label: "56", path: "spacing.56" },
  { label: "60", path: "spacing.60" },
  { label: "64", path: "spacing.64" },
  { label: "72", path: "spacing.72" },
  { label: "80", path: "spacing.80" },
  { label: "96", path: "spacing.96" },
] as const satisfies readonly TokenEntry[];

/** Project-extended sizes from panda.config.ts. */
export const customSizeTokens = [
  { label: "touch", path: "sizes.touch" },
  { label: "5.5", path: "sizes.5.5" },
  { label: "11", path: "sizes.11" },
  { label: "22", path: "sizes.22" },
  { label: "4rem", path: "sizes.4rem" },
  { label: "4.5rem", path: "sizes.4.5rem" },
  { label: "5.5rem", path: "sizes.5.5rem" },
  { label: "12rem", path: "sizes.12rem" },
  { label: "16rem", path: "sizes.16rem" },
  { label: "18rem", path: "sizes.18rem" },
  { label: "22rem", path: "sizes.22rem" },
  { label: "24rem", path: "sizes.24rem" },
  { label: "28rem", path: "sizes.28rem" },
  { label: "36rem", path: "sizes.36rem" },
  { label: "42rem", path: "sizes.42rem" },
  { label: "48rem", path: "sizes.48rem" },
  { label: "min-10", path: "sizes.min-10" },
  { label: "min-12", path: "sizes.min-12" },
  { label: "min-18", path: "sizes.min-18" },
  { label: "min-22", path: "sizes.min-22" },
  { label: "100dvh", path: "sizes.100dvh" },
  { label: "100dvb", path: "sizes.100dvb" },
  { label: "85dvh", path: "sizes.85dvh" },
  { label: "dialog-width", path: "sizes.dialog-width" },
  { label: "fit", path: "sizes.fit" },
] as const satisfies readonly TokenEntry[];

export const radiusTokens = [
  { label: "xs", path: "radii.xs" },
  { label: "sm", path: "radii.sm" },
  { label: "md", path: "radii.md" },
  { label: "lg", path: "radii.lg" },
  { label: "xl", path: "radii.xl" },
  { label: "2xl", path: "radii.2xl" },
  { label: "3xl", path: "radii.3xl" },
  { label: "4xl", path: "radii.4xl" },
  { label: "box", path: "radii.box" },
  { label: "sheet", path: "radii.sheet" },
  { label: "full", path: "radii.full" },
] as const satisfies readonly TokenEntry[];

export const borderWidthTokens = [
  { label: "none", path: "borderWidths.none" },
  { label: "thin", path: "borderWidths.thin" },
  { label: "medium", path: "borderWidths.medium" },
  { label: "thick", path: "borderWidths.thick" },
] as const satisfies readonly TokenEntry[];

export const shadowTokens = [
  { label: "2xs", path: "shadows.2xs" },
  { label: "xs", path: "shadows.xs" },
  { label: "sm", path: "shadows.sm" },
  { label: "md", path: "shadows.md" },
  { label: "lg", path: "shadows.lg" },
  { label: "xl", path: "shadows.xl" },
  { label: "2xl", path: "shadows.2xl" },
  { label: "accentRing", path: "shadows.accentRing" },
] as const satisfies readonly TokenEntry[];

export const durationTokens = [
  { label: "fastest", path: "durations.fastest" },
  { label: "faster", path: "durations.faster" },
  { label: "fast", path: "durations.fast" },
  { label: "normal", path: "durations.normal" },
  { label: "slow", path: "durations.slow" },
  { label: "slower", path: "durations.slower" },
  { label: "slowest", path: "durations.slowest" },
  { label: "skeleton", path: "durations.skeleton" },
  { label: "spin", path: "durations.spin" },
  { label: "fadeUp", path: "durations.fadeUp" },
  { label: "crossfade", path: "durations.crossfade" },
  { label: "press", path: "durations.press" },
  { label: "hover", path: "durations.hover" },
] as const satisfies readonly TokenEntry[];

export const easingTokens = [
  { label: "default", path: "easings.default" },
  { label: "linear", path: "easings.linear" },
  { label: "in", path: "easings.in" },
  { label: "out", path: "easings.out" },
  { label: "in-out", path: "easings.in-out" },
  { label: "press", path: "easings.press" },
] as const satisfies readonly TokenEntry[];

export const aspectRatioTokens = [
  { label: "square", path: "aspectRatios.square" },
  { label: "landscape", path: "aspectRatios.landscape" },
  { label: "portrait", path: "aspectRatios.portrait" },
  { label: "wide", path: "aspectRatios.wide" },
  { label: "ultrawide", path: "aspectRatios.ultrawide" },
  { label: "golden", path: "aspectRatios.golden" },
] as const satisfies readonly TokenEntry[];

export const breakpointTokens = [
  { label: "sm", path: "breakpoints.sm" },
  { label: "md", path: "breakpoints.md" },
  { label: "lg", path: "breakpoints.lg" },
  { label: "xl", path: "breakpoints.xl" },
  { label: "2xl", path: "breakpoints.2xl" },
] as const satisfies readonly TokenEntry[];

export const animationStyleNames = ["skeleton", "fadeUp", "crossfade"] as const;
