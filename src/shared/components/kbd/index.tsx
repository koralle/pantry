/**
 * @file index.tsx
 *
 * Input:    keyboard-shortcut label, optional tone + style props
 * Output:   Kbd component
 * Position: Inline key-hint chip for ⌘K / ⌘V / N style shortcuts
 *
 * SYNC: When modified, update these files to stay in sync:
 * - ./styles.ts (kbd recipe)
 */

import { styled } from "styled-system/jsx";

import { kbd } from "./styles";

export const Kbd = styled("kbd", kbd);
