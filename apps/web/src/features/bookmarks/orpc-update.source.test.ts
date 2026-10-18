import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

const featureDir = import.meta.dirname;

function readSource(relativePath: string): string {
  return readFileSync(join(featureDir, relativePath), "utf-8");
}

describe("UpdateBookmark oRPC migration source boundary", () => {
  test("edit route は update / load の Server Function を import しない", () => {
    const source = readSource("../../routes/_protected/bookmarks/$id/edit.tsx");
    expect(source).not.toContain("functions/update-bookmark'");
    expect(source).not.toContain("load-bookmark-for-edit");
    expect(source).toContain("orpc.bookmarks.update.mutationOptions");
    expect(source).toContain("orpc.bookmarks.editor.queryOptions");
    expect(source).not.toContain("error.name");
  });

  test("BookmarkEditor は旧 Application の port 型に依存しない", () => {
    const source = readSource("components/bookmark-editor/index.tsx");
    expect(source).not.toContain("application/execute-update-bookmark");
    expect(source).not.toContain("unexpected-error");
    expect(source).not.toContain("@orpc");
  });

  test("移行済みの Server Function と旧 Application ファイルは削除されている", () => {
    const removed = [
      "functions/update-bookmark.ts",
      "functions/update-bookmark.test.ts",
      "functions/load-bookmark-for-edit.ts",
      "application/execute-update-bookmark.ts",
      "application/execute-update-bookmark.test.ts",
      "application/load-bookmark-for-edit.ts",
      "application/load-bookmark-for-edit.test.ts",
    ];

    for (const relativePath of removed) {
      expect(
        existsSync(join(featureDir, relativePath)),
        relativePath
      ).toBeFalsy();
    }
  });
});
