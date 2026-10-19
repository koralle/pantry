import { describe, expect, it } from "vitest";

import { trustedOriginOf } from "./trusted-origin";

describe("trustedOriginOf", () => {
  it("BETTER_AUTH_URL の path や末尾の / を落として Origin にする", () => {
    expect(trustedOriginOf("https://pantry.example.com/")).toBe(
      "https://pantry.example.com"
    );
    expect(trustedOriginOf("http://localhost:5173/app?x=1")).toBe(
      "http://localhost:5173"
    );
  });

  it("未設定・空・URL でない・http(s) 以外は投げる（fail closed）", () => {
    for (const url of [
      undefined,
      "",
      "pantry.example.com",
      "file:///tmp/x",
      "data:text/plain,x",
    ]) {
      expect(() => trustedOriginOf(url), String(url)).toThrow();
    }
  });
});
