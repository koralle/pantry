/**
 * @file command-bar.tsx
 *
 * Input:    initial search value, submit handler, input ref
 * Output:   CommandBar component
 * Position: Center search/command surface in the top bar; doubles as the
 *           mobile top-bar search
 *
 * Uncontrolled by design — the URL search param is the source of truth and
 * the draft lives in the DOM. Callers reset the draft by changing `key`
 * (remount) rather than syncing state through an effect.
 *
 * SYNC: When modified, update these files to stay in sync:
 * - ./app-shell.tsx (⌘K focuses the input via inputRef)
 * - ../styles.ts (commandBar / commandInput recipes)
 * - ../../../shared/styles/kbd.ts (kbd recipe)
 */

import { Search } from "lucide-react";
import type { RefObject } from "react";
import { css, cx } from "styled-system/css";

import { kbd } from "../../../shared/styles/kbd";
import { commandBar, commandInput } from "../styles";

const formContents = css({ display: "contents" });

const kbdDesktopOnly = css({
  display: "none",
  md: { display: "inline" },
});

export interface CommandBarProps {
  defaultValue?: string | undefined;
  onSubmit: (value: string) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
}

export const CommandBar = ({
  defaultValue,
  onSubmit,
  inputRef,
}: CommandBarProps) => (
  <search className={commandBar}>
    <form
      className={formContents}
      onSubmit={(event) => {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get("q");
        onSubmit(typeof value === "string" ? value : "");
      }}
    >
      <Search aria-hidden size={14} />
      <input
        aria-label="検索"
        className={commandInput}
        defaultValue={defaultValue}
        name="q"
        placeholder="検索、タグ名、URLをそのまま入力…"
        ref={inputRef}
        type="search"
      />
      <kbd className={cx(kbd(), kbdDesktopOnly)}>⌘K</kbd>
    </form>
  </search>
);
