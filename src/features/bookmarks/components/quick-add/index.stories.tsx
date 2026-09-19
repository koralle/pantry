import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import type { Mock } from "storybook/test";
import { styled } from "styled-system/jsx";

import preview from "../../../../storybook/preview";
import type { CreateTagFromPickerAction } from "../../lib/tag-picker/execute-create-tag-from-picker";
import type { TagCandidate } from "../bookmark-tag-picker";
import { QuickAddScreen } from "./index";
import type { QuickAddScreenProps } from "./index";

const meta = preview.meta({
  component: QuickAddScreen,
  decorators: [
    (Story) => (
      <styled.div maxInlineSize="30rem">
        <Story />
      </styled.div>
    ),
  ],
  parameters: {
    layout: "padded",
  },
  title: "Components / QuickAdd",
});

const defaultTagCandidates: TagCandidate[] = [
  { id: 1, name: "React", pinned: true, sortOrder: 0 },
  { id: 2, name: "TypeScript", pinned: false, sortOrder: 0 },
  { id: 3, name: "Cloudflare", pinned: false, sortOrder: 1 },
];

const idleCreateTagAction = fn<CreateTagFromPickerAction>(async () => ({
  status: "idle",
}));

const defaultFetchTitleAction = fn<
  NonNullable<QuickAddScreenProps["fetchTitleAction"]>
>(async () => ({
  status: "success",
  title: "TanStack Router の型安全な検索パラメータ",
}));

const successCreateBookmark = fn<QuickAddScreenProps["onCreateBookmark"]>(
  async () => ({ id: "019fae92-3bb0-78cd-b488-65ce0e26a939", ok: true })
);

const baseArgs = {
  createTagAction: idleCreateTagAction,
  fetchTitleAction: defaultFetchTitleAction,
  onCreateBookmark: successCreateBookmark,
  tagCandidates: defaultTagCandidates,
  tagsReady: true,
} satisfies Partial<QuickAddScreenProps>;

const confirmArgs = {
  ...baseArgs,
  initialTitle: "TanStack Router の型安全な検索パラメータ",
  initialUrl: "https://tanstack.com/router/latest",
} satisfies Partial<QuickAddScreenProps>;

export const Input = meta.story({
  args: baseArgs,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const submit = canvas.getByRole("button", { name: "登録する" });
    await expect(submit).toBeDisabled();
    await userEvent.type(
      canvas.getByLabelText("URL"),
      "https://tanstack.com/router/latest"
    );
    await expect(submit).toBeEnabled();
    await userEvent.click(submit);
    const fetchTitleAction = args.fetchTitleAction as Mock<
      NonNullable<QuickAddScreenProps["fetchTitleAction"]>
    >;
    await waitFor(async () => {
      await expect(fetchTitleAction).toHaveBeenCalled();
    });
    // 取得完了で確認フェーズへ進み、ブックマーク行が出る
    await waitFor(async () => {
      await expect(
        canvas.getByText("TanStack Router の型安全な検索パラメータ")
      ).toBeInTheDocument();
    });
  },
});

export const RejectsBadUrl = meta.story({
  args: baseArgs,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("URL"), "tanstack");
    await userEvent.click(canvas.getByRole("button", { name: "登録する" }));
    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "URLの形式が正しくありません"
    );
    await expect(canvas.getByLabelText("URL")).toBeInTheDocument();
  },
});

export const Fetching = meta.story({
  args: {
    ...baseArgs,
    fetchTitleAction: fn<NonNullable<QuickAddScreenProps["fetchTitleAction"]>>(
      async () => await new Promise<never>(() => {})
    ),
    initialUrl: "https://tanstack.com/router/latest",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "登録する" }));
    await waitFor(async () => {
      await expect(canvas.getByText("タイトルを取得中…")).toBeInTheDocument();
    });
  },
});

export const Confirm = meta.story({
  args: confirmArgs,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByText("TanStack Router の型安全な検索パラメータ")
      ).toBeInTheDocument();
    });
    await expect(canvas.getByText("tanstack.com")).toBeInTheDocument();
    await expect(
      canvas.getByRole("searchbox", { name: "タグを検索・追加" })
    ).toBeInTheDocument();
    await expect(canvas.getByLabelText("メモ（任意）")).toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: "登録する" })
    ).toBeEnabled();
  },
});

export const TitleFetchFailed = meta.story({
  args: {
    ...baseArgs,
    initialTitle: "",
    initialTitleFailed: true,
    initialUrl: "https://example.com/page",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByText(/タイトルを取得できませんでした/)
      ).toBeInTheDocument();
    });
    await expect(canvas.getByLabelText("タイトル")).toBeInTheDocument();
    // 「そのまま登録」= 空タイトルはドメインへ倒す
    await userEvent.click(canvas.getByRole("button", { name: "登録する" }));
    const onCreateBookmark = args.onCreateBookmark as Mock<
      QuickAddScreenProps["onCreateBookmark"]
    >;
    await waitFor(async () => {
      await expect(onCreateBookmark).toHaveBeenCalledWith(
        expect.objectContaining({ title: "example.com" })
      );
    });
  },
});

export const SelectsTags = meta.story({
  args: confirmArgs,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const searchbox = await canvas.findByRole("searchbox", {
      name: "タグを検索・追加",
    });
    await userEvent.click(searchbox);
    // Popover は document.body に portal される
    const option = await body.findByRole("option", { name: /React/ });
    await userEvent.click(option);
    await waitFor(async () => {
      await expect(
        canvas.getByRole("button", { name: "Reactを外す" })
      ).toBeInTheDocument();
    });
  },
});

export const CreatesNewTag = meta.story({
  args: {
    ...confirmArgs,
    createTagAction: fn<CreateTagFromPickerAction>(
      async (_previous, payload) => ({
        status: "created",
        tag: { id: 42, name: payload.name },
      })
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const searchbox = await canvas.findByRole("searchbox", {
      name: "タグを検索・追加",
    });
    await userEvent.click(searchbox);
    await userEvent.type(searchbox, "Python");
    const createCta = await body.findByRole("button", {
      name: "「Python」を新しいタグとして作成",
    });
    await userEvent.click(createCta);
    await waitFor(async () => {
      await expect(
        canvas.getByRole("button", { name: "Pythonを外す" })
      ).toBeInTheDocument();
    });
  },
});

export const Saves = meta.story({
  args: confirmArgs,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "登録する" }));
    const onCreateBookmark = args.onCreateBookmark as Mock<
      QuickAddScreenProps["onCreateBookmark"]
    >;
    await waitFor(async () => {
      await expect(onCreateBookmark).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "TanStack Router の型安全な検索パラメータ",
          url: "https://tanstack.com/router/latest",
        })
      );
    });
    // 完了カードへ
    await waitFor(async () => {
      await expect(
        canvas.getByRole("heading", { name: "保存しました" })
      ).toBeInTheDocument();
    });
    await expect(
      canvas.getByRole("link", { name: /詳細を見る/ })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: /タグを編集/ })
    ).toBeInTheDocument();
  },
});

export const SaveFailure = meta.story({
  args: {
    ...confirmArgs,
    onCreateBookmark: fn<QuickAddScreenProps["onCreateBookmark"]>(async () => ({
      failure: { summary: "ブックマークの保存に失敗しました" },
      ok: false,
    })),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "登録する" }));
    await waitFor(async () => {
      await expect(canvas.getByRole("alert")).toHaveTextContent(
        "ブックマークの保存に失敗しました"
      );
    });
    await expect(
      canvas.getByRole("button", { name: "もう一度保存" })
    ).toBeEnabled();
    // 失敗後も下書きは残る
    await expect(canvas.getByLabelText("メモ（任意）")).toBeInTheDocument();
  },
});

export const SavePending = meta.story({
  args: {
    ...confirmArgs,
    onCreateBookmark: fn<QuickAddScreenProps["onCreateBookmark"]>(
      async () => await new Promise<never>(() => {})
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "登録する" }));
    await waitFor(async () => {
      await expect(
        canvas.getByRole("button", { name: "保存中…" })
      ).toBeDisabled();
    });
    await expect(canvas.getByLabelText("メモ（任意）")).toBeDisabled();
  },
});

export const RestartClearsDraft = meta.story({
  args: baseArgs,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByLabelText("URL"),
      "https://tanstack.com/router/latest"
    );
    await userEvent.click(canvas.getByRole("button", { name: "登録する" }));
    await waitFor(async () => {
      await expect(
        canvas.getByRole("button", { name: "登録する" })
      ).toBeEnabled();
    });
    await userEvent.click(canvas.getByRole("button", { name: "登録する" }));
    await waitFor(async () => {
      await expect(
        canvas.getByRole("heading", { name: "保存しました" })
      ).toBeInTheDocument();
    });
    await userEvent.click(canvas.getByRole("button", { name: "続けて登録" }));
    // 入力状態へ戻り、URL 下書きは空に戻る
    await waitFor(async () => {
      await expect(canvas.getByLabelText("URL")).toHaveValue("");
    });
  },
});

export const Mobile = meta.story({
  args: confirmArgs,
  globals: {
    viewport: {
      value: "iphone12",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      await expect(
        canvas.getByText("TanStack Router の型安全な検索パラメータ")
      ).toBeInTheDocument();
    });
    // モバイルではタグ入力がシート起動の readOnly になる
    await expect(
      canvas.getByRole("searchbox", { name: "タグを検索・追加" })
    ).toHaveAttribute("readonly");
  },
});
