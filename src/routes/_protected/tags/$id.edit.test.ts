import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

const dir = import.meta.dirname;

describe("edit tag route", () => {
  test("UpdateTagをoRPC mutationとして所有する", () => {
    const source = readFileSync(join(dir, "$id.edit.tsx"), "utf-8");

    expect(source).not.toContain("../functions/update-tag");
    expect(source).not.toContain("TagNameAlreadyExistsError");
    expect(source).not.toContain("error.name");
    expect(source).toContain("orpc.tags.update.mutationOptions");
    expect(source).toContain("refreshAfterUpdateTag");
  });
});
