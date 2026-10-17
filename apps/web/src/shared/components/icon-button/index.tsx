/**
 * @file index.tsx
 *
 * Input:    React Aria Components `Button`, Panda `styled` factory
 * Output:   IconButton component
 * Position: Ghost icon-only button for row actions, header icons, dialog close
 *
 * SYNC: When modified, update these files to stay in sync:
 * - ./index.stories.tsx
 * - ./styles.ts (variant surface)
 */

import { Button as AriaButton } from "react-aria-components";
import { styled } from "styled-system/jsx";
import type { HTMLStyledProps } from "styled-system/types";

import { iconButton } from "./styles";

const RawIconButton = styled(AriaButton, iconButton);

/**
 * `aria-label` is required at the type level: icon-only buttons have no
 * visible text, so the accessible name is the only name.
 */
type IconButtonProps = HTMLStyledProps<typeof RawIconButton> & {
  "aria-label": string;
};

export const IconButton = ({ type = "button", ...props }: IconButtonProps) => (
  <RawIconButton type={type} {...props} />
);
