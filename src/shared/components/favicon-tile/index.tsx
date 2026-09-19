/**
 * @file index.tsx
 *
 * Input:    domain string, fetch-failure flag, size
 * Output:   FaviconTile component
 * Position: Domain-color letter tile used in bookmark rows and detail header
 *
 * SYNC: When modified, update these files to stay in sync:
 * - ./index.stories.tsx
 */

import { Globe } from "lucide-react";
import { cva, cx } from "styled-system/css";

import { toneFor } from "../../../styles/domain-tone";
import type { DomainTone } from "../../../styles/domain-tone";

const faviconTile = cva({
  base: {
    alignItems: "center",
    borderRadius: "box",
    color: "white",
    display: "inline-flex",
    flexShrink: "0",
    fontWeight: "bold",
    justifyContent: "center",
    userSelect: "none",
  },
  defaultVariants: {
    failed: false,
    size: "sm",
    tone: "slate",
  },
  variants: {
    failed: {
      false: {},
      true: {
        background: "surface.muted",
        color: "fg.muted",
      },
    },
    size: {
      sm: {
        blockSize: "[1.375rem]",
        fontSize: "2xs",
        inlineSize: "[1.375rem]",
      },
      md: {
        blockSize: "[1.625rem]",
        fontSize: "[0.6875rem]",
        inlineSize: "[1.625rem]",
      },
      lg: {
        blockSize: "[2rem]",
        fontSize: "sm",
        inlineSize: "[2rem]",
      },
    },
    tone: {
      teal: { background: "domain.teal" },
      blue: { background: "domain.blue" },
      violet: { background: "domain.violet" },
      pink: { background: "domain.pink" },
      green: { background: "domain.green" },
      orange: { background: "domain.orange" },
      yellow: { background: "domain.yellow" },
      slate: { background: "domain.slate" },
    },
  },
});

export interface FaviconTileProps {
  domain: string;
  failed?: boolean | undefined;
  size?: "sm" | "md" | "lg" | undefined;
  tone?: DomainTone | undefined;
  className?: string | undefined;
}

/**
 * Decorative domain tile — the row/link around it already names the site,
 * so the tile is `aria-hidden` and must not be announced twice.
 */
export const FaviconTile = ({
  domain,
  failed = false,
  size,
  tone,
  className,
}: FaviconTileProps) => (
  <span
    aria-hidden
    className={cx(
      faviconTile({ failed, size, tone: tone ?? toneFor(domain) }),
      className
    )}
  >
    {failed ? (
      <Globe size={size === "lg" ? 16 : 12} strokeWidth={2} />
    ) : (
      domain.charAt(0).toUpperCase()
    )}
  </span>
);
