import { describe, expect, test } from "vitest";

import { isInternalPath } from "./is-internal-path";

describe(isInternalPath, () => {
  test("アプリ内 path だけを許す", () => {
    expect(isInternalPath("/")).toBeTruthy();
    expect(isInternalPath("/bookmarks?tags=work#top")).toBeTruthy();
    expect(isInternalPath("//example.com")).toBeFalsy();
    expect(isInternalPath("https://example.com/path")).toBeFalsy();
    expect(isInternalPath("bookmarks")).toBeFalsy();
  });
});
