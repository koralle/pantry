import { describe, expect, test } from "vitest";

import { pastedUrl } from "./pasted-url";

describe(pastedUrl, () => {
  test("http / https の URL は前後の空白を落として通す", () => {
    expect(pastedUrl("  https://example.com/a?b=1  ")).toBe(
      "https://example.com/a?b=1"
    );
    expect(pastedUrl("http://example.com")).toBe("http://example.com");
  });

  test("URL でない文字列は null", () => {
    expect(pastedUrl("")).toBeNull();
    expect(pastedUrl("   ")).toBeNull();
    expect(pastedUrl("ただのメモ")).toBeNull();
    expect(pastedUrl("example.com")).toBeNull();
  });

  test("http / https 以外のスキームは null", () => {
    expect(pastedUrl("file:///etc/passwd")).toBeNull();
    expect(pastedUrl("data:text/html,<h1>x</h1>")).toBeNull();
    expect(pastedUrl("mailto:someone@example.com")).toBeNull();
  });
});
