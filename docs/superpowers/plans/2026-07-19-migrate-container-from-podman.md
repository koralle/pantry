# Migrate Local DB Container from Podman Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ローカル開発用 Turso (libsql-server) を Podman Compose から Apple `container` CLI + Dockerfile + justfile に移行する。

**Architecture:** 薄い Dockerfile で公式 libsql-server イメージを pin し、justfile から `container build` / `run` / `stop` / `delete` を直接呼ぶ。migrate / seed は現行どおり。compose.yaml は削除する。

**Tech Stack:** apple/container CLI, Dockerfile, just, libsql-server, pnpm, dotenvx

**Spec:** `docs/superpowers/specs/2026-07-19-migrate-container-from-podman-design.md`

---

## File Structure

| 操作 | パス | 責務 |
| --- | --- | --- |
| Create | `Dockerfile` | 公式 libsql-server を digest pin した薄いイメージ定義 |
| Modify | `justfile` | `local-db-build` / `local-db-clean` を container CLI に置換 |
| Delete | `compose.yaml` | Podman Compose 定義を除去 |

---

### Task 1: Dockerfile を追加する

**Files:**
- Create: `Dockerfile`

- [ ] **Step 1: `Dockerfile` を作成する**

```dockerfile
FROM ghcr.io/tursodatabase/libsql-server@sha256:817fb6c6865d048a509f5c120905629fb9b5af20ad0c526cdc68a6d8793898ad
```

- [ ] **Step 2: ファイルが存在することを確認する**

Run: `test -f Dockerfile && cat Dockerfile`

Expected: 上記 1 行の `FROM` が表示される

- [ ] **Step 3: Commit**

```bash
git add Dockerfile
git commit -m "chore: add thin Dockerfile for local libsql-server"
```

---

### Task 2: justfile を apple/container 向けに書き換える

**Files:**
- Modify: `justfile`

- [ ] **Step 1: `justfile` を次の内容で置き換える**

```just
container_name := "pantry-turso"
image_tag := "pantry-turso:local"

local-db-build:
  @container stop {{container_name}} 2>/dev/null || true
  @container delete {{container_name}} 2>/dev/null || true
  @container build --platform linux/arm64 -t {{image_tag}} -f Dockerfile .
  @container run -d --name {{container_name}} --platform linux/arm64 -p 8080:8080 --tmpfs /var/lib/sqld {{image_tag}}
  @pnpm dotenvx run -f .env.development -- pnpm run migrate:dev
  @pnpm dotenvx run -f .env.development -- pnpm tsx scripts/seed.ts

local-db-clean:
  @container stop {{container_name}} 2>/dev/null || true
  @container delete {{container_name}} 2>/dev/null || true
  @container image delete --force {{image_tag}} 2>/dev/null || true
```

Notes:
- `2>/dev/null || true` でコンテナ/イメージが無い場合も失敗しない（idempotent）
- `container image delete --force` は存在しないイメージを無視できる
- migrate / seed コマンドは現行 justfile と同じ

- [ ] **Step 2: justfile の内容を確認する**

Run: `cat justfile`

Expected: `podman` が含まれず、`container build` / `container run` / `container stop` / `container delete` が含まれる

- [ ] **Step 3: Commit**

```bash
git add justfile
git commit -m "chore: switch local-db just recipes to apple/container"
```

---

### Task 3: compose.yaml を削除する

**Files:**
- Delete: `compose.yaml`

- [ ] **Step 1: `compose.yaml` を削除する**

```bash
git rm compose.yaml
```

- [ ] **Step 2: リポジトリ内に podman / compose 依存が残っていないことを確認する**

Run: `rg -n "podman|compose\\.yaml" --glob '!docs/**' --glob '!node_modules/**' --glob '!.git/**' || true`

Expected: マッチなし（docs 配下の design/plan は除外）

- [ ] **Step 3: Commit**

```bash
git add -u compose.yaml
git commit -m "chore: remove podman compose.yaml for local turso"
```

---

### Task 4: 動作確認する

**Files:**
- None (verification only)

Prerequisites:
- apple/container がインストール済み (`which container`)
- container system / machine が起動済みであること
- `.env.development` に `DATABASE_URL=http://127.0.0.1:8080` があること

- [ ] **Step 1: 既存のローカル DB コンテナを掃除する（任意）**

Run:

```bash
just local-db-clean
```

Expected: エラーなく完了（存在しなくても成功）

- [ ] **Step 2: ローカル DB を build / run / migrate / seed する**

Run:

```bash
just local-db-build
```

Expected:
- `container build` が成功する
- `pantry-turso` コンテナが detached で起動する
- migrate が成功する
- seed が成功する

- [ ] **Step 3: コンテナが動いていることを確認する**

Run:

```bash
container list
```

Expected: `pantry-turso` が running として表示される

- [ ] **Step 4: ホストから DB に到達できることを確認する**

Run:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8080/v2 || true
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8080/ || true
```

Expected: 接続拒否にならず、何らかの HTTP レスポンス（2xx/4xx 可）が返る

- [ ] **Step 5: clean でコンテナとローカルイメージが消えることを確認する**

Run:

```bash
just local-db-clean
container list --all
container image list | rg "pantry-turso" || true
```

Expected:
- `pantry-turso` コンテナが存在しない
- `pantry-turso:local` イメージが表示されない

- [ ] **Step 6: 再実行が idempotent であることを確認する**

Run:

```bash
just local-db-build
just local-db-build
```

Expected: 2 回目も既存コンテナを消してから再作成し、migrate / seed まで成功する

- [ ] **Step 7: 検証後にクリーンアップする**

Run:

```bash
just local-db-clean
```

Expected: エラーなく完了

---

## Spec Coverage Checklist

| Spec requirement | Task |
| --- | --- |
| 薄い Dockerfile 追加（digest pin） | Task 1 |
| justfile を container CLI に置換 | Task 2 |
| compose.yaml 削除 | Task 3 |
| migrate / seed 維持 | Task 2 |
| tmpfs / 8080 / pantry-turso / linux/arm64 | Task 2 |
| idempotent clean / rebuild | Task 2, Task 4 |
| podman / compose 依存の除去確認 | Task 3, Task 4 |
