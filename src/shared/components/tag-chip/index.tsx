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
  tone?: DomainTone;
  className?: string;
}

/** Decorative color dot — always `aria-hidden`, meaning comes from the tag name. */
export const TagDot = ({ tone = "slate", className }: TagDotProps) => (
  <i aria-hidden className={cx(tagDot({ tone }), className)} />
);

export interface TagChipProps {
  name: string;
  tone?: DomainTone;
  className?: string;
}

export const TagChip = ({ name, tone, className }: TagChipProps) => (
  <span className={cx(tagChip({ visual: "label" }), className)}>
    <TagDot tone={tone ?? toneFor(name)} />
    <span className={truncate}>{name}</span>
  </span>
);

const truncate = css({
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});
