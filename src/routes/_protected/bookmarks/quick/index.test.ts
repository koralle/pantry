import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

const dir = import.meta.dirname;
const routeSource = readFileSync(join(dir, "index.tsx"), "utf-8");
const protectedSource = readFileSync(
  join(dir, "../../../_protected.tsx"),
  "utf-8"
);
const screenSource = readFileSync(
  join(dir, "../../../../features/bookmarks/components/quick-add/index.tsx"),
  "utf-8"
);
const searchSource = readFileSync(
  join(dir, "../../../../features/navigation/lib/bookmark-search.ts"),
  "utf-8"
);

describe("quick add route", () => {
  test("QuickAddScreen を使う", () => {
    expect(routeSource).toContain(
      'from "../../../../features/bookmarks/components/quick-add"'
    );
    expect(routeSource).toContain("QuickAddScreen");
  });

  test("url search で prefill する", () => {
    expect(searchSource).toContain("bookmarkQuickAddSearchSchema");
    expect(routeSource).toContain("bookmarkQuickAddSearchSchema");
    // ?url= は画面に入れる前に URL スキーマで検証する
    expect(routeSource).toContain("bookmarkUrlSchema");
  });

  test("一覧条件を detail search として引き継ぐ", () => {
    expect(routeSource).toContain("listSearchFromDetail");
  });

  test("共有の title fetch action を使う", () => {
    expect(routeSource).toContain("bookmarkTitleFetchAction");
    expect(routeSource).not.toContain("fetchBookmarkTitle");
    // 画面内の取得と prefill ゲートで取得経路を分けない
    expect(routeSource).toContain("orpc.bookmarks.title.queryOptions");
  });

  test("CreateBookmark を oRPC mutationOptions 経由で送る", () => {
    expect(routeSource).toContain("orpc.bookmarks.create.mutationOptions");
    expect(routeSource).toContain("refreshAfterBookmarkMutation");
    expect(routeSource).toContain('"CreateBookmark"');
    expect(routeSource).toContain("buildNewBookmarkCommand");
  });

  test("Error の class 名と name に依存しない", () => {
    expect(routeSource).toContain("mapCreateBookmarkFailure");
    expect(routeSource).not.toContain("instanceof Error");
    expect(routeSource).not.toContain("error.message");
  });

  test("シェル無しの作業台として描画される", () => {
    expect(protectedSource).toContain(
      "SHELL_LESS_PATH = /^\\/bookmarks\\/(?:new|quick|[^/]+\\/edit)\\/?$/"
    );
    expect(routeSource).toContain("workbenchScreen");
    expect(routeSource).toContain("WorkbenchBar");
  });
});

describe("quick add screen", () => {
  test("状態遷移を画面内で完結させる", () => {
    expect(screenSource).toContain('"input"');
    expect(screenSource).toContain('"fetching"');
    expect(screenSource).toContain('"confirm"');
    expect(screenSource).toContain('"done"');
    // 完了はトーストではなく画面内状態
    expect(screenSource).toContain("保存しました");
    expect(screenSource).toContain("続けて登録");
    expect(screenSource).toContain("詳細を見る");
    expect(screenSource).toContain("タグを編集");
  });

  test("連続登録は round remount で初期化する（effect で後追いしない）", () => {
    expect(screenSource).toContain("key={round}");
    expect(screenSource).not.toMatch(/\buseEffect\(/);
  });

  test("タグ編集と詳細は一覧条件を引き継ぐ", () => {
    expect(screenSource).toContain('to="/bookmarks/$id/edit"');
    expect(screenSource).toContain('to="/bookmarks/$id"');
    expect(screenSource).toContain("search={detailSearch");
  });

  test("タグピッカーは既存のドラフト hook を共用する", () => {
    expect(screenSource).toContain("useBookmarkTagDraft");
    expect(screenSource).toContain("BookmarkTagPicker");
  });
});
