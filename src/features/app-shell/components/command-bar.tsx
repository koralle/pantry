/**
 * @file command-bar.tsx
 *
 * Input:    controlled search value, submit handler, input ref
 * Output:   CommandBar component
 * Position: Center search/command surface in the top bar; doubles as the
 *           mobile top-bar search
 *
 * SYNC: When modified, update these files to stay in sync:
 * - ./app-shell.tsx (⌘K focuses the input via inputRef)
 * - ../../../styles/shell.ts (commandBar / commandInput / kbd recipes)
 */

import { Search } from "lucide-react";
import type { RefObject } from "react";
import { css, cx } from "styled-system/css";

import { commandBar, commandInput, kbd } from "../../../styles/shell";

const formContents = css({ display: "contents" });

const kbdDesktopOnly = css({
  display: "none",
  md: { display: "inline" },
});

export interface CommandBarProps {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  inputRef?: RefObject<HTMLInputElement | null>;
}

export const CommandBar = ({
  value,
  onValueChange,
  onSubmit,
  inputRef,
}: CommandBarProps) => (
  <search className={commandBar}>
    <form
      className={formContents}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <Search aria-hidden size={14} />
      <input
        aria-label="検索"
        className={commandInput}
        onChange={(event) => {
          onValueChange(event.target.value);
        }}
        placeholder="検索、タグ名、URLをそのまま入力…"
        ref={inputRef}
        type="search"
        value={value}
      />
      <kbd className={cx(kbd(), kbdDesktopOnly)}>⌘K</kbd>
    </form>
  </search>
);
