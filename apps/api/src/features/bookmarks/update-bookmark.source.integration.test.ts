import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

const featureDir = import.meta.dirname;

function readSource(relativePath: string): string {
  return readFileSync(join(featureDir, relativePath), "utf-8");
}

describe("UpdateBookmark source boundary", () => {
  test("Application は Drizzle / AppDb / unexpected-error を import しない", () => {
    const source = readSource("application/update-bookmark.ts");
    expect(source).not.toContain("drizzle-orm");
    expect(source).not.toContain("AppDb");
    expect(source).not.toContain("unexpected-error");
    expect(source).not.toContain("@praha/error-factory");
  });

  test("Persistence adapter は UPDATE OR IGNORE を使い SQLite error を分類しない", () => {
    const source = readSource("persistence/update-bookmark/index.ts");
    expect(source).toContain("UPDATE OR IGNORE");
    expect(source).not.toContain("SQLITE_CONSTRAINT");
    expect(source).not.toContain("isSqliteUniqueConstraintError");
    expect(source).not.toContain("unexpected-error");
  });
});
