import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

const dir = import.meta.dirname;

describe("AppHeader", () => {
  const source = readFileSync(join(dir, "app-header.tsx"), "utf-8");

  test("search draft follows committed q during render, without an effect or remount key", () => {
    expect(source).toContain("committedQ !== prevCommittedQ");
    expect(source).not.toContain("useEffect");
    expect(source).not.toContain("key={listSearch?.q");
  });
});
