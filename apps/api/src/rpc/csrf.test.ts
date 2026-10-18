import { describe, expect, it } from "vitest";

import { isCsrfExemptProcedure } from "./csrf";

describe("isCsrfExemptProcedure", () => {
  it("副作用の無い health と me だけを外す", () => {
    expect(isCsrfExemptProcedure(["health"])).toBe(true);
    expect(isCsrfExemptProcedure(["me"])).toBe(true);
  });

  it("allowlist に無い procedure・入れ子・前方一致・prototype の key はヘッダー必須", () => {
    for (const path of [
      ["tags", "create"],
      ["bookmarks", "update"],
      ["bookmarks", "counts", "recent"],
      ["me", "update"],
      ["health", "me"],
      ["Me"],
      ["me "],
      ["toString"],
      ["constructor"],
      [],
    ]) {
      expect(isCsrfExemptProcedure(path), path.join("/")).toBe(false);
    }
  });
});
