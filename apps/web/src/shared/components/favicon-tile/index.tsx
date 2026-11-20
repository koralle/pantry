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

import { toneFor } from "../../styles/domain-tone";
import type { DomainTone } from "../../styles/domain-tone";

const faviconTile = cva({
  base: {
    alignItems: "center",
    borderRadius: "box",
    boxShadow: "[inset 0 0 0 1px rgba(0, 0, 0, 0.08)]",
    color: "white",
    display: "inline-flex",
    flexShrink: "0",
    fontWeight: "bold",
    justifyContent: "center",
    lineHeight: "1",
    userSelect: "none",
  },
  defaultVariants: {
    failed: false,
    size: "sm",
  },
  variants: {
    size: {
      sm: {
        blockSize: "[1.5rem]",
        fontSize: "2xs",
        inlineSize: "[1.5rem]",
      },
      md: {
        blockSize: "[1.75rem]",
        fontSize: "2xs",
        inlineSize: "[1.75rem]",
      },
      lg: {
        blockSize: "[2.25rem]",
        fontSize: "sm",
        inlineSize: "[2.25rem]",
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
    failed: {
      false: {},
      true: {
        background: "surface.muted",
        borderColor: "border.default",
        borderStyle: "solid",
        borderWidth: "thin",
        boxShadow: "none",
        color: "fg.muted",
      },
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
      faviconTile({
        failed,
        size,
        tone: failed ? undefined : (tone ?? toneFor(domain)),
      }),
      className
    )}
  >
    {failed ? (
      <Globe size={size === "lg" ? 16 : 13} strokeWidth={2} />
    ) : (
      domain.charAt(0).toUpperCase()
    )}
  </span>
);
