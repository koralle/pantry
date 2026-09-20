/**
 * @file index.tsx
 *
 * Input:    React Aria Components `Button`, iconButton recipe
 * Output:   StarToggle component
 * Position: Favorite toggle used in bookmark rows and the detail header
 *
 * SYNC: When modified, update these files to stay in sync:
 * - ./index.stories.tsx
 * - ../../../styles/icon-button.ts (shared surface)
 */

import { Star } from "lucide-react";
import { Button as AriaButton } from "react-aria-components";
import { css, cx } from "styled-system/css";

import { iconButton } from "../../../styles/icon-button";

const pressedStyle = css({
  "@media (any-hover: hover)": {
    "&:hover:not(:disabled)": {
      color: "star.solid",
    },
  },
  color: "star.solid",
});

const ICON_SIZE = { sm: 14, md: 16, lg: 18 } as const;

export interface StarToggleProps {
  pressed: boolean;
  size?: keyof typeof ICON_SIZE;
  onPress?: () => void;
  className?: string;
}

export const StarToggle = ({
  pressed,
  size = "md",
  className,
  ...props
}: StarToggleProps) => (
  <AriaButton
    aria-label={pressed ? "お気に入りから外す" : "お気に入りに追加"}
    aria-pressed={pressed}
    className={cx(iconButton({ size }), pressed && pressedStyle, className)}
    {...props}
  >
    <Star
      aria-hidden
      fill={pressed ? "currentColor" : "none"}
      size={ICON_SIZE[size]}
    />
  </AriaButton>
);
