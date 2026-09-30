import * as v from "valibot";

import { bookmarkIdSchema } from "../../domain/bookmark-values";

export interface BookmarkListCursor {
  readonly createdAtMs: number;
  readonly id: string;
}

const CURSOR_PATTERN = /^(?<createdAtMs>\d+):(?<id>.+)$/;

const parseCursorCreatedAtMs = (value: string | undefined): number | null => {
  if (value === undefined) {
    return null;
  }
  const createdAtMs = Number(value);
  if (
    !Number.isSafeInteger(createdAtMs) ||
    new Date(createdAtMs).getTime() !== createdAtMs
  ) {
    return null;
  }
  return createdAtMs;
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

  const createdAtMs = parseCursorCreatedAtMs(matched.groups?.["createdAtMs"]);
  const id = parseCursorBookmarkId(matched.groups?.["id"]);
  if (createdAtMs === null || id === null) {
    return null;
  }

  return { createdAtMs, id };
};

export const encodeBookmarkListCursor = (cursor: BookmarkListCursor): string =>
  `${cursor.createdAtMs}:${cursor.id}`;
