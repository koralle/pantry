import { describe, expect, test } from "vitest";
import { normalizeBookmarkUrl } from "../../services/bookmarks";

describe("normalizeBookmarkUrl", () => {
  test("lowercases scheme and host, strips default ports and fragments, and trims non-root trailing slash", () => {
    expect(normalizeBookmarkUrl(" HTTPS://Example.com:443/Article/#readme ")).toBe(
      "https://example.com/Article",
    );
    expect(normalizeBookmarkUrl("http://Example.com:80")).toBe("http://example.com/");
  });

  test("preserves query ordering and distinguishes http from https", () => {
    expect(normalizeBookmarkUrl("https://example.com/path?b=2&a=1")).toBe(
      "https://example.com/path?b=2&a=1",
    );
    expect(normalizeBookmarkUrl("http://example.com/path")).not.toBe(
      normalizeBookmarkUrl("https://example.com/path"),
    );
  });
});
