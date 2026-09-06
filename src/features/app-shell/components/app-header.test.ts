import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

const dir = import.meta.dirname;

describe("AppHeader", () => {
  const source = readFileSync(join(dir, "app-header.tsx"), "utf-8");

  test("search draft resets by key, not an effect", () => {
    expect(source).toContain('key={listSearch?.q ?? ""}');
    expect(source).not.toContain("useEffect");
  });
});
