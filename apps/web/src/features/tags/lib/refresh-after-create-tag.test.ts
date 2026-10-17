import { describe, expect, test, vi } from "vitest";

import { refreshAfterCreateTag } from "./refresh-after-create-tag";

describe(refreshAfterCreateTag, () => {
  test("route の再取得が失敗しても reject しない", async () => {
    const invalidate = vi.fn(async () => {
      throw new Error("loader failed");
    });
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      refreshAfterCreateTag({ invalidate });
    }).not.toThrow();

    await vi.waitFor(() => {
      expect(invalidate).toHaveBeenCalledOnce();
      expect(consoleError).toHaveBeenCalledWith(
        "Failed to refresh route data after CreateTag",
        expect.any(Error)
      );
    });

    consoleError.mockRestore();
  });
});
