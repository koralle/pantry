import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

const dir = import.meta.dirname;

describe("new tag route", () => {
  test("Error の class 名に依存しない", () => {
    const source = readFileSync(join(dir, "new.tsx"), "utf-8");
    expect(source).not.toContain("TagNameAlreadyExistsError");
    expect(source).not.toContain("error.name");
    expect(source).toContain("getCreateTagErrorMessage");
  });
});
