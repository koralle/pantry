import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

interface SourceRule {
  readonly file: string;
  readonly forbidden: readonly string[];
  readonly required?: readonly string[];
}

const srcRoot = join(import.meta.dirname, "..");

/**
 * Application / adapter が依存してはいけない実装詳細と、逆に残しておきたい SQL を
 * 1 箇所で検査する。増やすときはここへ 1 行足す。
 */
const rules: readonly SourceRule[] = [
  {
    file: "features/bookmarks/application/update-bookmark.ts",
    forbidden: [
      "@praha/error-factory",
      "AppDb",
      "drizzle-orm",
      "unexpected-error",
    ],
  },
  {
    file: "features/bookmarks/db/update-bookmark/index.ts",
    forbidden: [
      "SQLITE_CONSTRAINT",
      "isSqliteUniqueConstraintError",
      "unexpected-error",
    ],
    required: ["UPDATE OR IGNORE"],
  },
  {
    file: "features/bookmarks/db/insert-bookmark/index.ts",
    forbidden: ["SQLITE_CONSTRAINT", "isSqliteUniqueConstraintError"],
  },
  {
    file: "features/tags/db/insert-tag/index.ts",
    forbidden: ["isSqliteUniqueConstraintError"],
  },
  {
    file: "features/tags/db/update-tag/index.ts",
    forbidden: ["TagNameAlreadyExistsError", "isSqliteUniqueConstraintError"],
  },
];

const readSource = (relativePath: string): string =>
  readFileSync(join(srcRoot, relativePath), "utf-8");

describe("source boundary", () => {
  test.each(rules)(
    "$file は禁止された依存や例外判定を持たない",
    ({ file, forbidden, required = [] }) => {
      const source = readSource(file);

      for (const token of forbidden) {
        expect(source, `${file} must not contain ${token}`).not.toContain(
          token
        );
      }
      for (const token of required) {
        expect(source, `${file} must contain ${token}`).toContain(token);
      }
    }
  );
});
