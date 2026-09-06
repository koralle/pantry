import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

const dir = import.meta.dirname;

describe("InlineAddTag", () => {
  test("Error の class 名に依存しない", () => {
    const source = readFileSync(join(dir, "inline-add-tag.tsx"), "utf-8");
    expect(source).not.toContain("TagNameAlreadyExistsError");
    expect(source).not.toContain("error.name");
    expect(source).toContain("getCreateTagErrorMessage");
  });
});
