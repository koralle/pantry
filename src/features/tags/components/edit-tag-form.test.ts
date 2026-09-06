import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

const dir = import.meta.dirname;

describe("EditTagForm", () => {
  test("Errorのclass名ではなくoRPC code mapperを使う", () => {
    const source = readFileSync(join(dir, "edit-tag-form.tsx"), "utf-8");

    expect(source).not.toContain("../functions/update-tag");
    expect(source).not.toContain("TagNameAlreadyExistsError");
    expect(source).not.toContain("error.name");
    expect(source).toContain("getUpdateTagErrorMessage");
  });
});
