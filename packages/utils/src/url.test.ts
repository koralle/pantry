import { describe, expect, test } from "vitest";

import { domainOf } from "./url";

describe(domainOf, () => {
  test("returns the hostname of a URL", () => {
    expect(domainOf("https://example.com/path?q=1")).toBe("example.com");
  });

  test("falls back to the raw input when the URL cannot be parsed", () => {
    expect(domainOf("not a url")).toBe("not a url");
  });
});
