import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

const dir = import.meta.dirname;

describe("UiLoading", () => {
  const source = readFileSync(join(dir, "ui-loading.tsx"), "utf-8");

  test("spin animation lives on a wrapper, not the SVG", () => {
    expect(source).toContain("className={spinner}");
    expect(source).not.toContain("<LoaderCircle size={16} className={spinner}");
  });
});
