# Persistence Integration (Testcontainers + libSQL) Implementation Plan

> **For agentic workers:** Execute this plan against Issue #257. Spec authority is the current GitHub Issue body, not this file.

**Goal:** Testcontainers で起動した実 libSQL に本番と同じ migration を適用し、SQL / ownership の重要な semantics を Persistence Integration test で検証する。

**Architecture:** Vitest の別 config で Integration suite を分離する。globalSetup で libsql-server を 1 つ起動し、空 DB へ `drizzle/` の本番 migration を適用する。各テストは truncate で独立させる。`pnpm test` は Docker を起動しない。

**Tech Stack:** Vitest 4, Testcontainers 12 `GenericContainer`, `@libsql/client`, `drizzle-orm/libsql/migrator`, GitHub Actions

**Spec:** GitHub Issue #257（親: #161）

## Global Constraints

- 外部 Turso の可用性・認証情報・既存データへ依存しない
- 本番 schema をテストコード内へ DDL で手書き複製しない
- コンテナ名やホスト側ポート番号の固定を前提にしない
- テスト間で前のテストの DB 状態へ暗黙に依存しない
- `pnpm test` を Docker 必須にしない
- 全 Repository method を機械的に網羅しない
- flaky 失敗を retry の常用で隠蔽しない
- 既存 Unit test は削除しない（#259）

---

## 採用する実装方針

1. **コンテナ lifecycle:** Vitest `globalSetup` で libsql-server を 1 プロセスにつき 1 つ起動する。Testcontainers のランダムホストポートを使う。`/var/lib/sqld` は tmpfs。teardown で stop。
2. **イメージ:** リポジトリ `Dockerfile` と同じ digest（`ghcr.io/tursodatabase/libsql-server@sha256:817fb6c6865d048a509f5c120905629fb9b5af20ad0c526cdc68a6d8793898ad`）。platform は固定しない（CI は amd64、ローカルは各ホスト）。
3. **migration:** `drizzle-orm/libsql/migrator` の `migrate()` に `./drizzle` を渡し、`drizzle-kit migrate` と同じ SQL フォルダを適用する。
4. **テスト間 isolation:** `beforeEach` で `__drizzle_migrations` 以外のテーブルを `DELETE`。FK は PRAGMA で一時的に切る。
5. **実行分離:** `vitest.persistence.config.ts` + `pnpm test:persistence`。既定の `vitest.config.ts` は `*.integration.test.ts` を除外する。
6. **並列:** 共有 DB のため `maxWorkers: 1` / `fileParallelism: false`。retry は設定しない。
7. **CI:** `.github/workflows/ci.yaml` に `persistence-integration` job を追加する。GitHub の required check 登録は権限の都合で PR 上に依頼する。

## 主に影響を受ける領域

- `src/test/persistence/`（新規: コンテナ起動・migrate・reset・seed）
- `src/test/persistence/*.integration.test.ts`（semantics テスト）
- `vitest.config.ts` / `vitest.persistence.config.ts`
- `package.json` / `pnpm-workspace.yaml`
- `.github/workflows/ci.yaml`
- `docs/testing.md` / `AGENTS.md`

## 再利用する既存の抽象化

- Persistence 関数そのもの（`listBookmarks`, `insertBookmark`, `updateBookmark`, `softDeleteBookmark`, `getBookmarkDetail`, `selectBookmarkEditor`, `selectTagById`, `updateTag`, `touchTag`, `selectShelfTags`）
- Drizzle schema への insert（seed は DDL ではなく schema）
- 既存 Unit test の期待値（AND/OR、LIKE escape、tie-break、ownership）を実 libSQL 向けに再構成

## 重要な技術的判断

- 既存の in-memory Persistence Unit test は残す。本 Issue の対象外は棚卸し。
- テストは `env.ts` / `TURSO_*` を読まない。接続 URL は Testcontainers の mapped port だけ。
- 1 テスト 1 コンテナにはしない（起動コストと flaky を増やす）。空 DB + migrate は suite 開始時、行の独立性は truncate。
- ページングは 21 件で境界、同一 `createdAt` で id tie-break を見る。

## 必要なテストおよび検証方法

- list: cursor 境界、同一 timestamp の tie-break、タグ AND/OR、`%` `_` のリテラル検索、soft-deleted / 他ユーザー行を返さない
- ownership: 他ユーザーの bookmark/tag を get/update/delete/touch できない。他ユーザー tag の attach は bookmark を書かない
- transaction: insert 中の障害で部分書き込みが残らない
- soft delete: 削除済みは再削除せず、一覧・詳細から消える
- `pnpm test` が Docker なしで完走する
- `pnpm test:persistence` を連続 2 回実行して結果が安定する
- 代表的な production 条件を一時的に壊し、対応テストが失敗することを確認してから戻す

## 既知のリスクとトレードオフ

- GitHub の required status check は contents:write なしでは登録できない。job 追加までが実装範囲、required 化はリポジトリ設定。
- libsql HTTP 上の `migrate()` batch が失敗する場合は、同じ `drizzle/*/migration.sql` を statement 単位で適用する（DDL 手書きではない）。
- `/var/run` の権限は一部 Cloud Agent 環境で Docker socket を隠す。CI の ubuntu-24.04 では通常問題にならない。
