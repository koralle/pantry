/**
 * @file use-list-keyboard.ts
 *
 * Input:    item ids, layout, navigate
 * Output:   selectedId + j/k・矢印・Enter・T の一覧キーボード操作
 * Position: 一覧画面のショートカット（spec: screens/list, shell ヒントバー）
 */

import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const CARD_GRID_COLUMNS = 3;
const DESKTOP_QUERY = "(min-width: 48em)";

const isEditableTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable);

const isInteractiveTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  target.closest("a, button, [role='dialog'], [role='listbox']") !== null;

/** モーダルやウィジェット内部では一覧ショートカットを無効にする */
const isShortcutBlocked = (target: EventTarget | null): boolean =>
  document.querySelector("[role='dialog'], [role='alertdialog']") !== null ||
  (target instanceof HTMLElement &&
    target.closest(
      "[role='listbox'], [role='menu'], [role='combobox'], [role='option']"
    ) !== null);

const normalizeKey = (key: string): string =>
  key.length === 1 ? key.toLowerCase() : key;

const clampIndex = (current: number, delta: number, count: number): number => {
  if (count === 0) {
    return -1;
  }
  if (current === -1) {
    return delta > 0 ? 0 : count - 1;
  }
  return Math.min(count - 1, Math.max(0, current + delta));
};

export const useListKeyboard = ({
  ids,
  cards,
  identity,
}: {
  readonly ids: readonly string[];
  readonly cards: boolean;
  /** 一覧条件が変わったら選択をリセットするための同一性キー */
  readonly identity: string;
}): { selectedId: string | undefined } => {
  const navigate = useNavigate();
  const [selection, setSelection] = useState({ identity, index: -1 });
  const index = selection.identity === identity ? selection.index : -1;
  const selectedId = index >= 0 ? ids[index] : undefined;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (isEditableTarget(event.target) || isShortcutBlocked(event.target)) {
        return;
      }
      const key = normalizeKey(event.key);

      if (key === "t") {
        const firstTag = document.querySelector<HTMLElement>("[data-rail-tag]");
        if (firstTag !== null) {
          event.preventDefault();
          firstTag.focus();
        }
        return;
      }

      if (key === "Enter") {
        if (isInteractiveTarget(event.target) || selectedId === undefined) {
          return;
        }
        event.preventDefault();
        void navigate({
          params: { id: selectedId },
          to: "/bookmarks/$id",
        });
        return;
      }

      const column =
        cards && window.matchMedia(DESKTOP_QUERY).matches
          ? CARD_GRID_COLUMNS
          : 1;
      const delta = cards
        ? {
            ArrowDown: column,
            ArrowLeft: -1,
            ArrowRight: 1,
            ArrowUp: -column,
            j: column,
            k: -column,
          }[key]
        : { ArrowDown: 1, ArrowUp: -1, j: 1, k: -1 }[key];

      if (delta === undefined) {
        return;
      }
      event.preventDefault();
      setSelection({ identity, index: clampIndex(index, delta, ids.length) });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [cards, identity, ids.length, index, navigate, selectedId]);

  useEffect(() => {
    if (selectedId === undefined) {
      return;
    }
    for (const el of document.querySelectorAll(
      `[data-bookmark-id="${selectedId}"]`
    )) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [selectedId]);

  return { selectedId };
};
