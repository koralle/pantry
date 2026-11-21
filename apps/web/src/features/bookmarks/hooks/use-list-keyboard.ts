/**
 * @file use-list-keyboard.ts
 *
 * Input:    item ids, layout, detailSearch, navigate
 * Output:   selectedId + j/k・矢印・Enter・T・N・Escape・貼付の一覧キーボード操作
 * Position: 一覧画面のショートカット（spec: screens/list, shell ヒントバー）
 */

import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import type { BookmarkDetailSearch } from "../../navigation/lib/bookmark-search";
import { pastedUrl } from "../lib/pasted-url";

const CARD_GRID_COLUMNS = 3;
const DESKTOP_QUERY = "(min-width: 48em)";

const getCardGridColumns = (): number => {
  const grid = document.querySelector<HTMLElement>("[data-card-grid]");
  if (grid !== null) {
    const computed = window.getComputedStyle(grid);
    // 非表示のグリッドは used value ではなく `repeat(auto-fill, ...)` のような
    // 指定値を返すため、列数として数えられない。
    if (computed.display !== "none") {
      const templateColumns = computed.gridTemplateColumns.trim();
      if (templateColumns !== "" && templateColumns !== "none") {
        return Math.max(1, templateColumns.split(/\s+/u).length);
      }
    }
  }
  return window.matchMedia(DESKTOP_QUERY).matches ? CARD_GRID_COLUMNS : 1;
};

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
  detailSearch,
}: {
  readonly ids: readonly string[];
  readonly cards: boolean;
  /** 一覧条件が変わったら選択をリセットするための同一性キー */
  readonly identity: string;
  readonly detailSearch?: BookmarkDetailSearch | undefined;
}): { selectedId: string | undefined } => {
  const navigate = useNavigate();
  const [selection, setSelection] = useState({ identity, index: -1 });
  const index = selection.identity === identity ? selection.index : -1;
  // index が -1 のとき `ids[-1]` は undefined になるため、範囲チェックは不要。
  const selectedId = ids[index];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (isEditableTarget(event.target) || isShortcutBlocked(event.target)) {
        return;
      }
      const key = normalizeKey(event.key);

      if (key === "Escape") {
        if (index !== -1) {
          event.preventDefault();
          setSelection({ identity, index: -1 });
        }
        return;
      }

      if (key === "n") {
        event.preventDefault();
        void navigate({
          search: detailSearch ?? {},
          to: "/bookmarks/quick",
        });
        return;
      }

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

      const column = cards ? getCardGridColumns() : 1;
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

    const onPaste = (event: ClipboardEvent) => {
      if (isEditableTarget(event.target) || isShortcutBlocked(event.target)) {
        return;
      }
      const url = pastedUrl(event.clipboardData?.getData("text") ?? "");
      if (url === null) {
        return;
      }
      event.preventDefault();
      void navigate({
        search: { ...detailSearch, url },
        to: "/bookmarks/quick",
      });
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("paste", onPaste);
    };
  }, [cards, detailSearch, identity, ids.length, index, navigate, selectedId]);

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
