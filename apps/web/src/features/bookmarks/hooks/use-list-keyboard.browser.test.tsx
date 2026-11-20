import "../../../index.css";
import { useNavigate } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";

import { cardGrid } from "../styles";
import { useListKeyboard } from "./use-list-keyboard";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: vi.fn<() => unknown>(),
}));

const mockNavigate = vi.fn<(options: unknown) => Promise<void>>();

const IDS = ["id-0", "id-1", "id-2", "id-3", "id-4", "id-5"];

const Harness = ({
  cards,
  withDialog = false,
}: {
  readonly cards: boolean;
  readonly withDialog?: boolean;
}) => {
  const { selectedId } = useListKeyboard({
    cards,
    detailSearch: { view: "recent" },
    identity: "test",
    ids: IDS,
  });

  return (
    <div>
      <output data-testid="selected">{selectedId ?? "none"}</output>
      <input aria-label="検索" type="text" />
      {withDialog ? (
        <div aria-label="モーダル" role="alertdialog">
          modal
        </div>
      ) : null}
      {cards ? (
        <ul className={cardGrid} data-card-grid>
          {IDS.map((id) => (
            <li data-bookmark-id={id} key={id}>
              {id}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

const dispatchPaste = (text: string) => {
  const clipboardData = new DataTransfer();
  clipboardData.setData("text", text);
  const event = new ClipboardEvent("paste", {
    bubbles: true,
    cancelable: true,
    clipboardData,
  });
  window.dispatchEvent(event);
};

describe("useListKeyboard (browser)", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });

  afterEach(async () => {
    await page.viewport(1280, 800);
  });

  test("カード表示でも狭い画面（cardGrid が display: none）なら j は 1 件ずつ進む", async () => {
    await page.viewport(390, 844);
    const screen = await render(<Harness cards />);

    await userEvent.keyboard("j");
    await expect
      .element(screen.getByTestId("selected"))
      .toHaveTextContent("id-0");

    await userEvent.keyboard("j");
    await expect
      .element(screen.getByTestId("selected"))
      .toHaveTextContent("id-1");
  });

  test("広い画面のカード表示では実際のグリッド列数ぶん移動する", async () => {
    await page.viewport(1280, 800);
    const screen = await render(<Harness cards />);

    await userEvent.keyboard("j");
    await expect
      .element(screen.getByTestId("selected"))
      .toHaveTextContent("id-0");

    await userEvent.keyboard("j");
    await expect
      .element(screen.getByTestId("selected"))
      .toHaveTextContent("id-3");
  });

  test("Escape で選択を解除する", async () => {
    const screen = await render(<Harness cards={false} />);

    await userEvent.keyboard("j");
    await expect
      .element(screen.getByTestId("selected"))
      .toHaveTextContent("id-0");

    await userEvent.keyboard("{Escape}");
    await expect
      .element(screen.getByTestId("selected"))
      .toHaveTextContent("none");
  });

  test("n でクイック追加へ遷移し、入力欄やダイアログ内では反応しない", async () => {
    const screen = await render(<Harness cards={false} />);

    await userEvent.keyboard("n");
    expect(mockNavigate).toHaveBeenCalledWith({
      search: { view: "recent" },
      to: "/bookmarks/quick",
    });

    mockNavigate.mockReset();
    await screen.getByRole("textbox", { name: "検索" }).click();
    await userEvent.keyboard("n");
    expect(mockNavigate).not.toHaveBeenCalled();

    const withDialog = await render(<Harness cards={false} withDialog />);
    await withDialog.getByRole("alertdialog").click();
    await userEvent.keyboard("n");
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("有効な URL を貼り付けるとクイック追加へ遷移し、非 URL は無視する", async () => {
    await render(<Harness cards={false} />);

    dispatchPaste("ただのテキスト");
    expect(mockNavigate).not.toHaveBeenCalled();

    dispatchPaste("https://example.com/article");
    expect(mockNavigate).toHaveBeenCalledWith({
      search: { url: "https://example.com/article", view: "recent" },
      to: "/bookmarks/quick",
    });
  });
});
