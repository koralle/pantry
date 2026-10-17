import { uuidv7 } from "uuidv7";
import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { tagIdSchema } from "../../../tags/domain/tag-values";
import {
  bookmarkIdSchema,
  bookmarkNoteSchema,
  bookmarkTitleSchema,
  bookmarkUrlSchema,
} from "../../domain/bookmark-values";
import { buildUpdateBookmarkCommand } from "./bookmark-editor-command";

describe(buildUpdateBookmarkCommand, () => {
  test("送信時点の tag draft を保存対象にする", () => {
    const initialData = {
      bookmarkId: v.parse(bookmarkIdSchema, uuidv7()),
      note: v.parse(bookmarkNoteSchema, "Original note"),
      tagIds: [v.parse(tagIdSchema, 1), v.parse(tagIdSchema, 2)],
      title: v.parse(bookmarkTitleSchema, "Original"),
      url: v.parse(bookmarkUrlSchema, "https://example.com/original"),
    };

    expect(
      buildUpdateBookmarkCommand(initialData, {
        note: initialData.note,
        tagIds: [3, 1],
        title: initialData.title,
        url: initialData.url,
      })
    ).toStrictEqual({
      bookmarkId: initialData.bookmarkId,
      note: initialData.note,
      tagIds: [3, 1],
      title: initialData.title,
      url: initialData.url,
    });
  });

  test("空の tag draft は初期タグを残さず空配列で送る", () => {
    const initialData = {
      bookmarkId: v.parse(bookmarkIdSchema, uuidv7()),
      note: v.parse(bookmarkNoteSchema, "Original note"),
      tagIds: [v.parse(tagIdSchema, 1)],
      title: v.parse(bookmarkTitleSchema, "Original"),
      url: v.parse(bookmarkUrlSchema, "https://example.com/original"),
    };

    expect(
      buildUpdateBookmarkCommand(initialData, {
        note: initialData.note,
        tagIds: [],
        title: initialData.title,
        url: initialData.url,
      }).tagIds
    ).toStrictEqual([]);
  });
});
