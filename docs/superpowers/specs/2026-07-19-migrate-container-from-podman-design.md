# Migrate Local DB Container from Podman to apple/container

## Goal

ローカル開発用 Turso (libsql-server) の起動手段を Podman Compose から Apple の `container` CLI + Dockerfile + justfile に移行する。

## Scope

- `compose.yaml` を削除する
- 薄い `Dockerfile` を追加する（公式 libsql-server イメージを pin）
- `justfile` の `local-db-build` / `local-db-clean` を `container` コマンドに書き換える
- 既存の migrate / seed フローは維持する

## Out of Scope

- 永続ボリュームへの変更（現行どおり tmpfs）
- アプリ本体・DB 接続設定の変更
- CI や本番デプロイ経路の変更

## Constraints

- apple/container には Compose 相当がないため、`container build` / `container run` / `container stop` / `container delete` を just から直接呼ぶ
- イメージ digest は現行 compose と同じものを維持する
- ホスト側接続先は `DATABASE_URL=http://127.0.0.1:8080` のまま
- コンテナ名は `pantry-turso`、ローカルタグは `pantry-turso:local`
- platform は `linux/arm64`

## Design

### Dockerfile

```dockerfile
FROM ghcr.io/tursodatabase/libsql-server@sha256:817fb6c6865d048a509f5c120905629fb9b5af20ad0c526cdc68a6d8793898ad
```

公式イメージをそのまま使う薄い Dockerfile。再現性のために digest pin を残す。

### justfile

#### `local-db-build`

1. 既存の `pantry-turso` コンテナがあれば stop / delete（再実行を idempotent にする）
2. `container build --platform linux/arm64 -t pantry-turso:local -f Dockerfile .`
3. `container run -d --name pantry-turso --platform linux/arm64 -p 8080:8080 --tmpfs /var/lib/sqld pantry-turso:local`
4. 既存どおり migrate / seed を実行

```
pnpm dotenvx run -f .env.development -- pnpm run migrate:dev
pnpm dotenvx run -f .env.development -- pnpm tsx scripts/seed.ts
```

#### `local-db-clean`

1. `container stop pantry-turso`（存在しなければ無視）
2. `container delete pantry-turso`（存在しなければ無視）
3. `container image delete pantry-turso:local`（存在しなければ無視）

### Files

| 操作 | パス |
| --- | --- |
| 追加 | `Dockerfile` |
| 更新 | `justfile` |
| 削除 | `compose.yaml` |

## Data / Runtime Behavior

- DB データは tmpfs 上のため、コンテナ削除で消える（現行 compose と同じ）
- ポート公開は `8080:8080`
- アプリ・migrate・seed の接続先は変更しない

## Risks

- apple/container の CLI フラグや idempotent な削除挙動が Podman と異なる可能性がある → just 側で存在確認または失敗許容にする
- イメージ pull / build が初回に時間がかかる → ローカルタグで再利用する

## Success Criteria

- `just local-db-build` で Turso が起動し、migrate / seed が通る
- `http://127.0.0.1:8080` に接続できる
- `just local-db-clean` でコンテナとローカルイメージが消える
- リポジトリ内に `podman` / `compose.yaml` 依存が残らない
