import "../../../index.css";
import { afterEach, describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";

import { CopyButton } from "./index";

describe("CopyButton (browser)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("コピー成功時はボタン名と live region が完了表示になる", async () => {
    const writeText = vi
      .fn<(text: string) => Promise<void>>()
      .mockResolvedValue(undefined);
    vi.spyOn(navigator.clipboard, "writeText").mockImplementation(writeText);

    const screen = await render(
      <CopyButton
        announcement="URLをコピーしました"
        label="URLをコピー"
        value="https://example.com"
      />
    );

    await screen.getByRole("button", { name: "URLをコピー" }).click();

    expect(writeText).toHaveBeenCalledWith("https://example.com");
    await expect
      .element(screen.getByRole("button", { name: "URLをコピーしました" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("status"))
      .toHaveTextContent("URLをコピーしました");
  });

  test("コピー失敗時はボタン名と live region で失敗を伝える", async () => {
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new Error("denied")
    );

    const screen = await render(
      <CopyButton
        announcement="URLをコピーしました"
        label="URLをコピー"
        value="https://example.com"
      />
    );

    await screen.getByRole("button", { name: "URLをコピー" }).click();

    await expect
      .element(screen.getByRole("button", { name: "コピーに失敗しました" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("status"))
      .toHaveTextContent("コピーに失敗しました");
  });
});
