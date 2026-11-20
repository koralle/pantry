import { describe, expect, test } from "vitest";

import { trustedOriginOf } from "./trusted-origin";

describe(trustedOriginOf, () => {
  test("BETTER_AUTH_URL の path や末尾の / を落として Origin にする", () => {
    expect(trustedOriginOf("https://pantry.example.com/")).toBe(
      "https://pantry.example.com"
    );
    expect(trustedOriginOf("http://localhost:5173/app?x=1")).toBe(
      "http://localhost:5173"
    );
  });

  test("未設定・空・URL でない・http(s) 以外は投げる（fail closed）", () => {
    const cases: readonly (readonly [string | undefined, RegExp])[] = [
      [undefined, /BETTER_AUTH_URL is not set/u],
      ["", /BETTER_AUTH_URL is not set/u],
      ["pantry.example.com", /Invalid URL/u],
      ["file:///tmp/x", /must be an http\(s\) URL/u],
      ["data:text/plain,x", /must be an http\(s\) URL/u],
    ];

    for (const [url, message] of cases) {
      expect(() => trustedOriginOf(url)).toThrow(message);
    }
  });
});
