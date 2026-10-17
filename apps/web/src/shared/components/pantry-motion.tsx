import type { ReactNode } from "react";
import { css, cx } from "styled-system/css";

type PantryMotionKind = "fade-up" | "crossfade";

const kindClass: Record<PantryMotionKind, string> = {
  crossfade: css({ animationStyle: "crossfade" }),
  "fade-up": css({ animationStyle: "fadeUp" }),
};

export const PantryMotion = ({
  kind,
  children,
  className,
}: {
  readonly kind: PantryMotionKind;
  readonly children: ReactNode;
  readonly className?: string;
}) => <div className={cx(kindClass[kind], className)}>{children}</div>;
