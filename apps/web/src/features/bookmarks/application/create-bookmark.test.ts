import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { userIdSchema } from "../../auth/domain/auth-values";
import { tagIdSchema } from "../../tags/domain/tag-values";
import {
  bookmarkIdSchema,
  bookmarkNoteSchema,
  bookmarkTitleSchema,
  bookmarkUrlSchema,
} from "../domain/bookmark-values";
import {
  createBookmarkInputSchema,
  executeCreateBookmark,
} from "./create-bookmark";
import type {
  CreateBookmarkCommand,
  InsertBookmark,
  InsertBookmarkOutput,
} from "./create-bookmark";

function parseUserId(value: string) {
  return v.parse(userIdSchema, value);
}

function parseCommand(input: unknown): CreateBookmarkCommand {
  return v.parse(createBookmarkInputSchema, input);
}

/**
 * 戻り値を固定した port。Drizzle のメソッドチェーンは mock しない。
 * Application は SQL や transaction の組み立てを知らない、という境界をテストが壊さないため。
 */
function fakeInsertBookmark(output: InsertBookmarkOutput): InsertBookmark {
  return async () => output;
}

function baseInput() {
  return {
    note: null,
    tags: [] as number[],
    title: "Example Article",
    url: "https://example.com/article",
  };
}

describe(executeCreateBookmark, () => {
  test("port の created をそのまま Result.ok へ載せる", async () => {
    const id = v.parse(
      bookmarkIdSchema,
      "01900000-0000-7000-8000-000000000000"
    );
    const result = await executeCreateBookmark({
      command: parseCommand(baseInput()),
      insertBookmark: fakeInsertBookmark({ id, kind: "created" }),
      userId: parseUserId("user-1"),
    });

    expect(result).toStrictEqual({
      ok: true,
      value: { id },
    });
  });

  test("duplicate-url を Expected Error へ写す", async () => {
    const result = await executeCreateBookmark({
      command: parseCommand(baseInput()),
      insertBookmark: fakeInsertBookmark({ kind: "duplicate-url" }),
      userId: parseUserId("user-1"),
    });

    expect(result).toStrictEqual({
      error: { code: "duplicate-url" },
      ok: false,
    });
  });

  test("invalid-tag を Expected Error へ写す", async () => {
    const result = await executeCreateBookmark({
      command: parseCommand(baseInput()),
      insertBookmark: fakeInsertBookmark({ kind: "invalid-tag" }),
      userId: parseUserId("user-1"),
    });

    expect(result).toStrictEqual({
      error: { code: "invalid-tag" },
      ok: false,
    });
  });

  test("port の未知の失敗は潰さず throw する", async () => {
    await expect(
      executeCreateBookmark({
        command: parseCommand(baseInput()),
        insertBookmark: async () => {
          throw new Error("disk exploded");
        },
        userId: parseUserId("user-1"),
      })
    ).rejects.toThrow("disk exploded");
  });

  test("userId とコマンド値を port へそのまま渡す", async () => {
    let received: Parameters<InsertBookmark>[0] | undefined;
    const command = parseCommand({
      note: "メモ",
      tags: [1, 2],
      title: "Later",
      url: "https://example.com/later",
    });

    await executeCreateBookmark({
      command,
      insertBookmark: async (input) => {
        received = input;
        return {
          id: v.parse(bookmarkIdSchema, "01900000-0000-7000-8000-000000000001"),
          kind: "created",
        };
      },
      userId: parseUserId("user-9"),
    });

    expect(received).toStrictEqual({
      note: v.parse(bookmarkNoteSchema, "メモ"),
      tagIds: [v.parse(tagIdSchema, 1), v.parse(tagIdSchema, 2)],
      title: v.parse(bookmarkTitleSchema, "Later"),
      url: v.parse(bookmarkUrlSchema, "https://example.com/later"),
      userId: parseUserId("user-9"),
    });
  });

  test("空文字 note は null に正規化して port へ渡す", async () => {
    let received: Parameters<InsertBookmark>[0] | undefined;

    await executeCreateBookmark({
      command: parseCommand({
        note: "",
        tags: [],
        title: "Note",
        url: "https://example.com/note",
      }),
      insertBookmark: async (input) => {
        received = input;
        return {
          id: v.parse(bookmarkIdSchema, "01900000-0000-7000-8000-000000000002"),
          kind: "created",
        };
      },
      userId: parseUserId("user-1"),
    });

    expect(received?.note).toBeNull();
  });
});
