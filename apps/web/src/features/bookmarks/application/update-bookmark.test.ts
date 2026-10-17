import { describe, expect, test, vi } from "vitest";

import {
  bookmarkId,
  bookmarkNote,
  bookmarkTitle,
  bookmarkUrl,
  tagId,
  userId,
} from "./test-helpers";
import { executeUpdateBookmark } from "./update-bookmark";
import type { UpdateBookmark, UpdateBookmarkOutput } from "./update-bookmark";

function createCommand(
  overrides: Partial<{
    id: ReturnType<typeof bookmarkId>;
    url: ReturnType<typeof bookmarkUrl>;
    title: ReturnType<typeof bookmarkTitle>;
    note: ReturnType<typeof bookmarkNote>;
    tags: ReturnType<typeof tagId>[];
  }> = {}
) {
  return {
    id: overrides.id ?? bookmarkId(),
    note: overrides.note ?? bookmarkNote(null),
    tags: overrides.tags ?? [],
    title: overrides.title ?? bookmarkTitle("Example"),
    url: overrides.url ?? bookmarkUrl("https://example.com"),
  };
}

function createPort(output?: UpdateBookmarkOutput) {
  const port = vi.fn<UpdateBookmark>(
    async () => output ?? { id: bookmarkId(), kind: "updated" }
  );
  return port;
}

describe(executeUpdateBookmark, () => {
  test("成功時は port へ actor 付き command を渡し ok(id) を返す", async () => {
    const actor = userId("user-1");
    const id = bookmarkId();
    const command = createCommand({ id, tags: [tagId(1)] });
    const port = createPort();

    const result = await executeUpdateBookmark({
      command,
      updateBookmark: port,
      userId: actor,
    });

    expect(result).toStrictEqual({
      ok: true,
      value: { id: expect.any(String) },
    });
    expect(port).toHaveBeenCalledOnce();
    expect(port).toHaveBeenCalledWith({
      bookmarkId: command.id,
      note: command.note,
      tagIds: [tagId(1)],
      title: command.title,
      url: command.url,
      userId: actor,
    });
  });

  test("重複する tag ID は invalid-tag になり、port を呼ばない", async () => {
    const port = createPort();
    const command = createCommand({ tags: [tagId(1), tagId(1)] });

    const result = await executeUpdateBookmark({
      command,
      updateBookmark: port,
      userId: userId("user-1"),
    });

    expect(result).toStrictEqual({ error: { code: "invalid-tag" }, ok: false });
    expect(port).not.toHaveBeenCalled();
  });

  test("bookmark-not-found を Expected Error へ写す", async () => {
    const port = createPort({ kind: "bookmark-not-found" } as const);

    const result = await executeUpdateBookmark({
      command: createCommand(),
      updateBookmark: port,
      userId: userId("user-1"),
    });

    expect(result).toStrictEqual({
      error: { code: "bookmark-not-found" },
      ok: false,
    });
  });

  test("duplicate-url を Expected Error へ写す", async () => {
    const port = createPort({ kind: "duplicate-url" } as const);

    const result = await executeUpdateBookmark({
      command: createCommand(),
      updateBookmark: port,
      userId: userId("user-1"),
    });

    expect(result).toStrictEqual({
      error: { code: "duplicate-url" },
      ok: false,
    });
  });

  test("invalid-tag を Expected Error へ写す", async () => {
    const port = createPort({ kind: "invalid-tag" } as const);

    const result = await executeUpdateBookmark({
      command: createCommand({ tags: [tagId(2)] }),
      updateBookmark: port,
      userId: userId("user-1"),
    });

    expect(result).toStrictEqual({ error: { code: "invalid-tag" }, ok: false });
  });

  test("未知の障害は throw して伝播する", async () => {
    const port = vi.fn<UpdateBookmark>(async () => {
      throw new Error("disk exploded");
    });

    await expect(
      executeUpdateBookmark({
        command: createCommand(),
        updateBookmark: port,
        userId: userId("user-1"),
      })
    ).rejects.toThrow("disk exploded");
  });
});
