import { expect, fn, userEvent, within } from "storybook/test";

import preview from "../../storybook/preview";
import { FatalErrorScreen } from "./fatal-error-screen";

const meta = preview.meta({
  component: FatalErrorScreen,
  parameters: {
    layout: "fullscreen",
  },
  title: "Components / FatalErrorScreen",
});

export const Default = meta.story({
  name: "既定",
  args: {
    onReload: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("問題が発生しました")).toBeInTheDocument();
    await expect(
      canvas.getByText(/予期しないエラーが発生しました/)
    ).toBeInTheDocument();
    const reload = canvas.getByRole("button", { name: "再読み込み" });
    await userEvent.click(reload);
    await expect(args.onReload).toHaveBeenCalled();
  },
});
