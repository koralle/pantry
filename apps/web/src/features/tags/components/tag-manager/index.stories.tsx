import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import type { Mock } from "storybook/test";

import preview from "../../../../storybook/preview";
import type { ShelfTag } from "../../lib/tag-shelf";
import { TagManagerScreen } from "./index";
import type { TagManagerScreenProps } from "./index";

const meta = preview.meta({
  component: TagManagerScreen,
  parameters: {
    layout: "fullscreen",
    viewport: {
      defaultViewport: "desktop",
      options: {
        desktop: {
          name: "Desktop",
          styles: { height: "800px", width: "1280px" },
          type: "desktop",
        },
      },
    },
  },
  title: "Components / TagManager",
});

const tags: ShelfTag[] = [
  {
    bookmarkCount: 34,
    color: "#3b82f6",
    id: 1,
    lastUsedAt: null,
    name: "frontend",
    pinned: false,
    sortOrder: 0,
  },
  {
    bookmarkCount: 18,
    color: "#14b8a6",
    id: 2,
    lastUsedAt: null,
    name: "tanstack",
    pinned: false,
    sortOrder: 1,
  },
  {
    bookmarkCount: 12,
    color: "#22c55e",
    id: 3,
    lastUsedAt: null,
    name: "db",
    pinned: false,
    sortOrder: 2,
  },
  {
    bookmarkCount: 11,
    color: "#eab308",
    id: 4,
    lastUsedAt: null,
    name: "infra",
    pinned: false,
    sortOrder: 3,
  },
  {
    bookmarkCount: 9,
    color: "#f97316",
    id: 5,
    lastUsedAt: null,
    name: "auth",
    pinned: false,
    sortOrder: 4,
  },
  {
    bookmarkCount: 8,
    color: "#a855f7",
    id: 6,
    lastUsedAt: null,
    name: "design",
    pinned: false,
    sortOrder: 5,
  },
  {
    bookmarkCount: 9,
    color: "#8b5cf6",
    id: 7,
    lastUsedAt: null,
    name: "tanstack-query",
    pinned: false,
    sortOrder: 6,
  },
];

const baseArgs = {
  onCreateTag: fn<TagManagerScreenProps["onCreateTag"]>(async () => ({
    ok: true,
  })),
  onDeleteTag: fn<TagManagerScreenProps["onDeleteTag"]>(async () => ({
    ok: true,
  })),
  onRenameTag: fn<TagManagerScreenProps["onRenameTag"]>(async () => ({
    ok: true,
  })),
  tags,
} satisfies Partial<TagManagerScreenProps>;

export const Ideal = meta.story({
  name: "標準",
  args: baseArgs,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "タグ" })
    ).toBeInTheDocument();
    await expect(canvas.getByText("7 件")).toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: "新規タグ" })
    ).toBeInTheDocument();
    await expect(
      canvas.getByPlaceholderText("タグを検索…")
    ).toBeInTheDocument();
    // 行タップはそのタグの一覧へ向かう
    await expect(
      canvas.getByRole("link", { name: /frontend/ })
    ).toHaveAttribute("href", "/bookmarks");
    await expect(
      canvas.getByRole("button", { name: "「frontend」を改名" })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: "「frontend」を削除" })
    ).toBeInTheDocument();
  },
});

export const SearchFilter = meta.story({
  name: "検索で絞り込み",
  args: baseArgs,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByPlaceholderText("タグを検索…"), "tan");
    await waitFor(async () => {
      await expect(
        canvas.getByRole("link", { name: /tanstack-query/ })
      ).toBeInTheDocument();
      await expect(
        canvas.queryByRole("link", { name: /frontend/ })
      ).not.toBeInTheDocument();
    });
    // クリアボタンで絞り込みを戻す
    await userEvent.click(canvas.getByRole("button", { name: "検索をクリア" }));
    await waitFor(async () => {
      await expect(
        canvas.getByRole("link", { name: /frontend/ })
      ).toBeInTheDocument();
    });
  },
});

export const SearchNoMatch = meta.story({
  name: "検索ヒットなし",
  args: baseArgs,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByPlaceholderText("タグを検索…"),
      "存在しないタグ"
    );
    await waitFor(async () => {
      await expect(
        canvas.getByText("見つかりませんでした")
      ).toBeInTheDocument();
    });
  },
});

export const Empty = meta.story({
  name: "空",
  args: { ...baseArgs, tags: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("タグはまだありません")).toBeInTheDocument();
    // Empty からそのまま作成ダイアログへ進める
    await userEvent.click(canvas.getByRole("button", { name: "タグを作成" }));
    const body = within(document.body);
    await waitFor(async () => {
      await expect(
        body.getByRole("heading", { name: "新規タグ" })
      ).toBeInTheDocument();
    });
  },
});

export const CreatesTag = meta.story({
  name: "タグを作成",
  args: baseArgs,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await userEvent.click(canvas.getByRole("button", { name: "新規タグ" }));
    await waitFor(async () => {
      await expect(
        body.getByRole("heading", { name: "新規タグ" })
      ).toBeInTheDocument();
    });
    await userEvent.type(body.getByLabelText("タグ名"), "observability");
    await userEvent.click(body.getByRole("button", { name: "作成" }));
    const onCreateTag = args.onCreateTag as Mock<
      TagManagerScreenProps["onCreateTag"]
    >;
    await waitFor(async () => {
      await expect(onCreateTag).toHaveBeenCalledWith("observability");
    });
    // 成功でダイアログは閉じる
    await waitFor(async () => {
      await expect(
        body.queryByRole("heading", { name: "新規タグ" })
      ).not.toBeInTheDocument();
    });
  },
});

export const CreateNameConflict = meta.story({
  name: "名前重複で作成失敗",
  args: {
    ...baseArgs,
    onCreateTag: fn<TagManagerScreenProps["onCreateTag"]>(async () => ({
      message: "そのタグ名は既に存在します",
      ok: false,
    })),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await userEvent.click(canvas.getByRole("button", { name: "新規タグ" }));
    await userEvent.type(body.getByLabelText("タグ名"), "frontend");
    await userEvent.click(body.getByRole("button", { name: "作成" }));
    // 失敗は入力を保ったままダイアログ内に alert で出る
    await waitFor(async () => {
      await expect(body.getByRole("alert")).toHaveTextContent(
        "そのタグ名は既に存在します"
      );
    });
    await expect(body.getByLabelText("タグ名")).toHaveValue("frontend");
    await expect(
      body.getByRole("heading", { name: "新規タグ" })
    ).toBeInTheDocument();
  },
});

export const RejectsEmptyName = meta.story({
  name: "空名を拒否",
  args: baseArgs,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await userEvent.click(canvas.getByRole("button", { name: "新規タグ" }));
    await userEvent.click(body.getByRole("button", { name: "作成" }));
    await waitFor(async () => {
      await expect(body.getByRole("alert")).toHaveTextContent(
        "タグ名を入力してください"
      );
    });
    const onCreateTag = args.onCreateTag as Mock<
      TagManagerScreenProps["onCreateTag"]
    >;
    await expect(onCreateTag).not.toHaveBeenCalled();
  },
});

export const RenamesTag = meta.story({
  name: "タグ名を変更",
  args: baseArgs,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await userEvent.click(
      canvas.getByRole("button", { name: "「frontend」を改名" })
    );
    await waitFor(async () => {
      await expect(
        body.getByRole("heading", { name: "タグ名を変更" })
      ).toBeInTheDocument();
    });
    // 現在の名前が下書きに入る
    await expect(body.getByLabelText("タグ名")).toHaveValue("frontend");
    await userEvent.clear(body.getByLabelText("タグ名"));
    await userEvent.type(body.getByLabelText("タグ名"), "frontend-2026");
    await userEvent.click(body.getByRole("button", { name: "保存" }));
    const onRenameTag = args.onRenameTag as Mock<
      TagManagerScreenProps["onRenameTag"]
    >;
    await waitFor(async () => {
      await expect(onRenameTag).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1 }),
        "frontend-2026"
      );
    });
    await waitFor(async () => {
      await expect(
        body.queryByRole("heading", { name: "タグ名を変更" })
      ).not.toBeInTheDocument();
    });
  },
});

export const DeletesTag = meta.story({
  name: "タグを削除",
  args: baseArgs,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await userEvent.click(
      canvas.getByRole("button", { name: "「frontend」を削除" })
    );
    await waitFor(async () => {
      await expect(
        body.getByRole("heading", { name: "「frontend」を削除しますか？" })
      ).toBeInTheDocument();
    });
    // 紐付いたブックマークから外れることを明示する
    await expect(
      body.getByText(/34 件のブックマークからも外れます/)
    ).toBeInTheDocument();
    await userEvent.click(body.getByRole("button", { name: "削除" }));
    const onDeleteTag = args.onDeleteTag as Mock<
      TagManagerScreenProps["onDeleteTag"]
    >;
    await waitFor(async () => {
      await expect(onDeleteTag).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1 })
      );
    });
    await waitFor(async () => {
      await expect(
        body.queryByRole("heading", {
          name: "「frontend」を削除しますか？",
        })
      ).not.toBeInTheDocument();
    });
  },
});

export const DeleteKeepsDialogOnFailure = meta.story({
  name: "失敗時はダイアログを維持",
  args: {
    ...baseArgs,
    onDeleteTag: fn<TagManagerScreenProps["onDeleteTag"]>(async () => ({
      message: "タグの削除に失敗しました",
      ok: false,
    })),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await userEvent.click(canvas.getByRole("button", { name: "「db」を削除" }));
    await userEvent.click(body.getByRole("button", { name: "削除" }));
    await waitFor(async () => {
      await expect(body.getByRole("alert")).toHaveTextContent(
        "タグの削除に失敗しました"
      );
    });
    await expect(
      body.getByRole("heading", { name: "「db」を削除しますか？" })
    ).toBeInTheDocument();
  },
});

export const SavingCreate = meta.story({
  name: "作成中",
  args: {
    ...baseArgs,
    onCreateTag: fn<TagManagerScreenProps["onCreateTag"]>(
      async () => await new Promise<never>(() => {})
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await userEvent.click(canvas.getByRole("button", { name: "新規タグ" }));
    await userEvent.type(body.getByLabelText("タグ名"), "observability");
    await userEvent.click(body.getByRole("button", { name: "作成" }));
    // 保存中は操作を無効化し、キャンセルも閉じられない
    // RAC Button の isPending は aria-disabled 属性を使う
    await waitFor(async () => {
      await expect(body.getByRole("button", { name: "作成" })).toHaveAttribute(
        "aria-disabled",
        "true"
      );
    });
    await expect(
      body.getByRole("button", { name: "キャンセル" })
    ).toBeDisabled();
  },
});

export const Mobile = meta.story({
  name: "モバイル",
  args: baseArgs,
  globals: {
    viewport: {
      value: "iphone12",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "タグ" })
    ).toBeInTheDocument();
    // mobile では `+` アイコンボタンと行末 chevron を表示する。
    // 表示切替はメディアクエリ（CSS）側の責務なので、DOM 上は両 variant が存在する
    await expect(
      canvas.getByRole("button", { name: "新規タグ" })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: /frontend/ })
    ).toBeInTheDocument();
  },
});
