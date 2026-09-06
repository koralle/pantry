import * as v from "valibot";

import { bookmarkIdSchema } from "../domain/bookmark-values";

export interface BookmarkListCursor {
  readonly sortValueMs: number;
  readonly id: string;
}

const CURSOR_PATTERN = /^(?<sortValueMs>\d+):(?<id>.+)$/;

const parseCursorSortValueMs = (value: string | undefined): number | null => {
  if (value === undefined) {
    return null;
  }
  const sortValueMs = Number(value);
  if (
    !Number.isSafeInteger(sortValueMs) ||
    new Date(sortValueMs).getTime() !== sortValueMs
  ) {
    return null;
  }
  return sortValueMs;
};

const parseCursorBookmarkId = (value: string | undefined): string | null => {
  if (value === undefined) {
    return null;
  }
  const parsedId = v.safeParse(bookmarkIdSchema, value);
  return parsedId.success ? parsedId.output : null;
};

export const decodeBookmarkListCursor = (
  value: string
): BookmarkListCursor | null => {
  const matched = CURSOR_PATTERN.exec(value);
  if (matched === null) {
    return null;
  }

  const sortValueMs = parseCursorSortValueMs(matched.groups?.["sortValueMs"]);
  const id = parseCursorBookmarkId(matched.groups?.["id"]);
  if (sortValueMs === null || id === null) {
    return null;
  }

  return { id, sortValueMs };
};

export const encodeBookmarkListCursor = (cursor: BookmarkListCursor): string =>
  `${cursor.sortValueMs}:${cursor.id}`;
