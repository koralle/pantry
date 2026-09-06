import { describe, expect, test, vi } from "vitest";

import type { UserId } from "../../auth/domain/auth-values";
import { executeDeleteBookmark } from "./delete-bookmark";
import type { SoftDeleteBookmark } from "./delete-bookmark";

const userId = "user-1" as UserId;
const bookmarkId = "019fae92-3bb0-78cd-b488-65ce0e26a001";

function stubPort(output: Awaited<ReturnType<SoftDeleteBookmark>>) {
  const softDeleteBookmark: SoftDeleteBookmark = vi.fn(async () => output);
  return { softDeleteBookmark };
}

describe(executeDeleteBookmark, () => {
  test("成功時は port の deleted を actor と id 付きで返す", async () => {
    const { softDeleteBookmark } = stubPort({
      id: bookmarkId,
      kind: "deleted",
    });

    const result = await executeDeleteBookmark({
      command: { id: bookmarkId },
      softDeleteBookmark,
      userId,
    });

    expect(softDeleteBookmark).toHaveBeenCalledWith({ id: bookmarkId, userId });
    expect(result).toStrictEqual({ id: bookmarkId, kind: "deleted" });
  });

  test("port の not-found をそのまま返す", async () => {
    const { softDeleteBookmark } = stubPort({ kind: "bookmark-not-found" });

    const result = await executeDeleteBookmark({
      command: { id: "missing" },
      softDeleteBookmark,
      userId,
    });

    expect(result).toStrictEqual({ kind: "bookmark-not-found" });
  });

  test("未知の障害は包み直さず throw する", async () => {
    const softDeleteBookmark: SoftDeleteBookmark = vi.fn(async () => {
      throw new Error("disk exploded");
    });

    await expect(
      executeDeleteBookmark({
        command: { id: bookmarkId },
        softDeleteBookmark,
        userId,
      })
    ).rejects.toThrow("disk exploded");
  });
});
