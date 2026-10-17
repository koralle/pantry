/**
 * マイグレーションが schema.ts から drizzle-kit で生成されたものだけかを検査する。
 *
 * 1. 各マイグレーションフォルダに migration.sql と snapshot.json が揃っている
 * 2. snapshot の prevIds が直前のマイグレーションへ連なっている
 * 3. migration.sql が「直前の snapshot → 当該 snapshot」から drizzle-kit が
 *    生成する SQL と完全に一致する（手書き・手編集の検出）
 * 4. `drizzle-kit generate` が新しいマイグレーションを作らない（schema.ts と
 *    最新 snapshot の drift 検出）
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { generateMigration } from "drizzle-kit/payload/sqlite";

type SqliteSnapshot = Parameters<typeof generateMigration>[0];

const PACKAGE_DIR = path.resolve(import.meta.dirname, "..");
const MIGRATIONS_DIR = path.join(PACKAGE_DIR, "drizzle");
const SQL_FILE = "migration.sql";
const SNAPSHOT_FILE = "snapshot.json";
/** drizzle-kit がファイルへ書き出すときの statement 区切り。 */
const STATEMENT_BREAKPOINT = "--> statement-breakpoint\n";
/** drizzle-kit が最初のマイグレーションの prevIds に入れる起点 ID。 */
const ORIGIN_SNAPSHOT_ID = "00000000-0000-0000-0000-000000000000";
const EXIT_FAILURE = 1;

/**
 * 本番適用済みで書き換えられない、手で編集されたマイグレーション。
 * 内容を SHA-256 で固定し、これ以上の編集は検出する。
 */
const LEGACY_HAND_EDITED_SQL: Readonly<Record<string, string>> = {
  "20260818093729_tag_normalized_name":
    "83cd737f3f6ce807743081872bffb2344c4875557b82a00ba65982728f2e08bf",
  "20260919000000_bookmark_favorite":
    "b7a1343771cda53da24759ad28928334cf093334ee07274d2fab034082f7a297",
  "20260930150000_drop_bookmarks_updated_at_index":
    "bd63da8568489a9c3f09dcbb9a6e0a7b9f0849f0e927bb15e26d89831f763963",
};

const emptySnapshot: SqliteSnapshot = {
  ddl: [],
  dialect: "sqlite",
  id: ORIGIN_SNAPSHOT_ID,
  prevIds: [],
  renames: [],
  version: "7",
};

const sha256 = (content: string): string =>
  createHash("sha256").update(content).digest("hex");

const listMigrationFolders = (): string[] =>
  readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .toSorted();

const readSnapshot = (folder: string): SqliteSnapshot =>
  JSON.parse(
    readFileSync(path.join(MIGRATIONS_DIR, folder, SNAPSHOT_FILE), "utf-8")
  ) as SqliteSnapshot;

const checkFilesExist = (folders: readonly string[]): string[] =>
  folders.flatMap((folder) =>
    [SQL_FILE, SNAPSHOT_FILE]
      .filter((file) => !existsSync(path.join(MIGRATIONS_DIR, folder, file)))
      .map((file) => `${folder}: ${file} がありません`)
  );

const checkSqlMatchesSnapshot = async (
  folder: string,
  previous: SqliteSnapshot,
  current: SqliteSnapshot
): Promise<string[]> => {
  if (!current.prevIds.includes(previous.id)) {
    return [
      `${folder}: snapshot の prevIds (${current.prevIds.join(", ")}) が直前の snapshot (${previous.id}) を指していません`,
    ];
  }

  if (current.renames.length > 0) {
    return [
      `${folder}: rename を含む snapshot は再生成で検証できません（renames: ${current.renames.join(", ")}）`,
    ];
  }

  const committed = readFileSync(
    path.join(MIGRATIONS_DIR, folder, SQL_FILE),
    "utf-8"
  );
  const regenerated = (await generateMigration(previous, current)).join(
    STATEMENT_BREAKPOINT
  );

  if (committed === regenerated) {
    return [];
  }

  const legacyHash = LEGACY_HAND_EDITED_SQL[folder];
  if (legacyHash !== undefined && legacyHash === sha256(committed)) {
    return [];
  }

  return [
    `${folder}: migration.sql が snapshot から drizzle-kit が生成する SQL と一致しません（手書き・手編集は禁止）\n--- 期待する SQL ---\n${regenerated}\n--- コミットされた SQL ---\n${committed}`,
  ];
};

const checkCommittedMigrations = async (
  folders: readonly string[]
): Promise<string[]> => {
  const errors: string[] = [];
  let previous = emptySnapshot;

  for (const folder of folders) {
    const current = readSnapshot(folder);
    // 直前の結果に依存して snapshot を順に辿るため、逐次に検査する。
    // oxlint-disable-next-line no-await-in-loop
    errors.push(...(await checkSqlMatchesSnapshot(folder, previous, current)));
    previous = current;
  }

  return errors;
};

interface GenerateExplainOutput {
  readonly status: string;
  readonly statements?: readonly unknown[];
}

/** `drizzle-kit generate --explain` はファイルを書かずに、生成されるはずの statement を返す。 */
const checkSchemaDrift = (): string[] => {
  const result = spawnSync(
    "drizzle-kit",
    ["generate", "--explain", "--output", "json"],
    {
      cwd: PACKAGE_DIR,
      encoding: "utf-8",
      env: {
        ...process.env,
        // drizzle.config.ts は接続情報を必須にするが、generate は DB に接続しない。
        TURSO_AUTH_TOKEN: process.env["TURSO_AUTH_TOKEN"] ?? "unused",
        TURSO_CONNECTION_URL:
          process.env["TURSO_CONNECTION_URL"] ?? "http://127.0.0.1:8080",
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  if (result.status !== 0) {
    return [
      `drizzle-kit generate --explain が失敗しました (exit ${result.status})\n${result.stdout}${result.stderr}`,
    ];
  }

  const jsonLine = result.stdout
    .split("\n")
    .findLast((line) => line.startsWith("{"));
  if (jsonLine === undefined) {
    return [
      `drizzle-kit generate --explain の出力を読めません\n${result.stdout}`,
    ];
  }

  const output = JSON.parse(jsonLine) as GenerateExplainOutput;
  if (output.status === "no_changes") {
    return [];
  }

  return [
    `schema.ts と最新の snapshot がずれています。pnpm --filter @pantry/db exec drizzle-kit generate でマイグレーションを生成してください\n${JSON.stringify(output.statements ?? output, null, 2)}`,
  ];
};

const main = async (): Promise<void> => {
  const folders = listMigrationFolders();
  const missingFiles = checkFilesExist(folders);
  const errors =
    missingFiles.length > 0
      ? missingFiles
      : [...(await checkCommittedMigrations(folders)), ...checkSchemaDrift()];

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`✗ ${error}`);
    }
    process.exit(EXIT_FAILURE);
  }

  console.log(`✓ ${folders.length} 件のマイグレーションを検査しました`);
};

await main();
