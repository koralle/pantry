/**
 * @file index.tsx
 *
 * Input:    tag name, optional tone override
 * Output:   TagChip / TagDot components
 * Position: Compact tag label used in bookmark rows, detail, and tag lists
 *
 * SYNC: When modified, update these files to stay in sync:
 * - ./index.stories.tsx
 * - ../../../styles/tag-chip.ts (chip + dot recipes)
 */

import { css, cx } from "styled-system/css";

import type { DomainTone } from "../../../styles/domain-tone";
import { toneFor } from "../../../styles/domain-tone";
import { tagChip, tagDot } from "../../../styles/tag-chip";

export interface TagDotProps {
  tone?: DomainTone | undefined;
  color?: string | null | undefined;
  className?: string | undefined;
}

/** Decorative color dot — always `aria-hidden`, meaning comes from the tag name. */
export const TagDot = ({ tone = "slate", color, className }: TagDotProps) => (
  <i
    aria-hidden
    className={cx(tagDot({ tone }), className)}
    style={color ? { background: color } : undefined}
  />
);

export interface TagChipProps {
  name: string;
  tone?: DomainTone | undefined;
  color?: string | null | undefined;
  className?: string | undefined;
}

export const TagChip = ({ name, tone, color, className }: TagChipProps) => (
  <span className={cx(tagChip({ visual: "label" }), className)}>
    <TagDot color={color} tone={tone ?? toneFor(name)} />
    <span className={truncate}>{name}</span>
  </span>
);

const truncate = css({
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});
