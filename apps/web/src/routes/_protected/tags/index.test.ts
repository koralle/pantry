import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

const dir = import.meta.dirname;
const routeSource = readFileSync(join(dir, "index.tsx"), "utf-8");
const screenSource = readFileSync(
  join(dir, "../../../features/tags/components/tag-manager/index.tsx"),
  "utf-8"
);

describe("tags route", () => {
  test("TagManagerScreen を使い、棚は parent の cache を読む", () => {
    expect(routeSource).toContain(
      'from "../../../features/tags/components/tag-manager"'
    );
    expect(routeSource).toContain("TagManagerScreen");
    expect(routeSource).toContain("shelfTagsPromise");
    expect(routeSource).not.toContain("tags.list");
    expect(routeSource).not.toContain("tags.shelf");
  });

  test("create / update / delete を oRPC mutationOptions 経由で所有する", () => {
    expect(routeSource).toContain("orpc.tags.create.mutationOptions");
    expect(routeSource).toContain("orpc.tags.update.mutationOptions");
    expect(routeSource).toContain("orpc.tags.delete.mutationOptions");
    expect(routeSource).toContain("refreshAfterCreateTag");
    expect(routeSource).toContain("refreshAfterUpdateTag");
    expect(routeSource).toContain("refreshAfterDeleteTag");
  });

  test("update は full-replace 契約に従い現状値を送る", () => {
    expect(routeSource).toContain("color: tag.color");
    expect(routeSource).toContain("pinned: tag.pinned");
    expect(routeSource).toContain("sortOrder: tag.sortOrder");
  });

  test("Error の class 名に依存しない", () => {
    expect(routeSource).toContain("getCreateTagErrorMessage");
    expect(routeSource).toContain("getUpdateTagErrorMessage");
    expect(routeSource).toContain("getDeleteTagErrorMessage");
    expect(routeSource).not.toContain("TagNameAlreadyExistsError");
    expect(routeSource).not.toContain("error.name");
  });
});

describe("tag manager screen", () => {
  test("一覧・検索・3種のダイアログを持つ", () => {
    expect(screenSource).toContain("タグを検索…");
    expect(screenSource).toContain("新規タグ");
    expect(screenSource).toContain('"create"');
    expect(screenSource).toContain('"rename"');
    expect(screenSource).toContain('"delete"');
    // 削除は紐付け解除を明示する
    expect(screenSource).toContain("ブックマークからも外れます");
  });

  test("行タップはそのタグの一覧へ向かう", () => {
    expect(screenSource).toContain("tagShelfSearch");
    expect(screenSource).toContain('to="/bookmarks"');
  });
});
