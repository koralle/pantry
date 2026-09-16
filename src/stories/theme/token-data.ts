/**
 * Token catalogs for the theme stories.
 *
 * Project-defined tokens are derived from the theme sources under `panda/`
 * so this file cannot drift from the config. Tokens provided by Panda's
 * built-in presets (spacing, default font sizes, ...) are listed statically.
 *
 * Catalog display order follows the key order of the `panda/` source files —
 * keep those keys ordered by design logic (e.g. size ascending).
 */
import type { Token } from "styled-system/tokens";

import { colors as themeColors } from "../../../panda/colors";
import { animationStyles, motion as themeMotion } from "../../../panda/motion";
import { semanticColors as themeSemanticColors } from "../../../panda/semantic-colors";
import { shadows as themeShadows } from "../../../panda/shadows";
import { shape as themeShape } from "../../../panda/shape";
import { sizes as themeSizes } from "../../../panda/sizes";
import { typography as themeTypography } from "../../../panda/typography";

export interface TokenEntry {
  readonly path: Token;
  readonly label: string;
}

interface TokenTree {
  readonly [key: string]: TokenTree | { readonly value: unknown };
}

const collectEntries = (
  category: string,
  tree: TokenTree,
  trail: readonly string[] = []
): TokenEntry[] =>
  Object.entries(tree).flatMap(([key, node]) => {
    if ("value" in node) {
      const label = [...trail, key].join(".");
      return [{ label, path: `${category}.${label}` as Token }];
    }
    return collectEntries(category, node, [...trail, key]);
  });

export const pantryColors = collectEntries("colors", themeColors.colors);

export const semanticColors = collectEntries(
  "colors",
  themeSemanticColors.colors
);

const defaultFonts = [
  { label: "sans", path: "fonts.sans" },
  { label: "serif", path: "fonts.serif" },
  { label: "mono", path: "fonts.mono" },
] as const satisfies readonly TokenEntry[];

export const fontTokens = [
  ...collectEntries("fonts", themeTypography.fonts),
  ...defaultFonts,
];

const defaultFontSizes = [
  { label: "sm", path: "fontSizes.sm" },
  { label: "xl", path: "fontSizes.xl" },
  { label: "2xl", path: "fontSizes.2xl" },
  { label: "4xl", path: "fontSizes.4xl" },
] as const satisfies readonly TokenEntry[];

export const fontSizeTokens = [
  ...collectEntries("fontSizes", themeTypography.fontSizes),
  ...defaultFontSizes,
];

const defaultLineHeights = [
  { label: "none", path: "lineHeights.none" },
  { label: "snug", path: "lineHeights.snug" },
  { label: "normal", path: "lineHeights.normal" },
  { label: "loose", path: "lineHeights.loose" },
] as const satisfies readonly TokenEntry[];

export const lineHeightTokens = [
  ...collectEntries("lineHeights", themeTypography.lineHeights),
  ...defaultLineHeights,
];

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

/** Project-extended sizes, derived from panda/sizes.ts. */
export const customSizeTokens = collectEntries("sizes", themeSizes.sizes);

const defaultRadii = [
  { label: "xs", path: "radii.xs" },
  { label: "sm", path: "radii.sm" },
  { label: "md", path: "radii.md" },
  { label: "lg", path: "radii.lg" },
  { label: "xl", path: "radii.xl" },
  { label: "2xl", path: "radii.2xl" },
  { label: "3xl", path: "radii.3xl" },
  { label: "4xl", path: "radii.4xl" },
] as const satisfies readonly TokenEntry[];

export const radiusTokens = [
  ...collectEntries("radii", themeShape.radii),
  ...defaultRadii,
];

export const borderWidthTokens = collectEntries(
  "borderWidths",
  themeShape.borderWidths
);

const defaultShadows = [
  { label: "2xs", path: "shadows.2xs" },
  { label: "xs", path: "shadows.xs" },
  { label: "sm", path: "shadows.sm" },
  { label: "md", path: "shadows.md" },
  { label: "lg", path: "shadows.lg" },
  { label: "xl", path: "shadows.xl" },
  { label: "2xl", path: "shadows.2xl" },
] as const satisfies readonly TokenEntry[];

export const shadowTokens = [
  ...collectEntries("shadows", themeShadows.shadows),
  ...defaultShadows,
];

const defaultDurations = [
  { label: "fastest", path: "durations.fastest" },
  { label: "faster", path: "durations.faster" },
  { label: "fast", path: "durations.fast" },
  { label: "normal", path: "durations.normal" },
  { label: "slow", path: "durations.slow" },
  { label: "slower", path: "durations.slower" },
  { label: "slowest", path: "durations.slowest" },
] as const satisfies readonly TokenEntry[];

export const durationTokens = [
  ...collectEntries("durations", themeMotion.durations),
  ...defaultDurations,
];

const defaultEasings = [
  { label: "default", path: "easings.default" },
  { label: "linear", path: "easings.linear" },
  { label: "in", path: "easings.in" },
  { label: "out", path: "easings.out" },
  { label: "in-out", path: "easings.in-out" },
] as const satisfies readonly TokenEntry[];

export const easingTokens = [
  ...collectEntries("easings", themeMotion.easings),
  ...defaultEasings,
];

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

export const animationStyleNames: readonly string[] =
  Object.keys(animationStyles);
