# Seed Script Design

## Goal

`scripts/seed.ts` を完成させ、ローカルの SQLite/libsql DB に開発用ダミーデータを流せるようにする。

## Scope

- 1 ユーザーの作成（`koralle@example.com` / `password` / `koralle`）
- タグ 500 件
- ブックマーク 200 件
- ブックマークとタグの中間テーブル 300 件

## Constraints

- 実行のたびに既存データを削除して作り直す。
- `user` テーブルに `password` カラムがないため、Better Auth の `auth.api.signUpEmail` を使ってアカウントも含めて作成する。
- `drizzle-seed` を使ってタグ・ブックマーク・中間テーブルを生成する。

## Data Flow

1. `reset(db, fullSchema)` で `users`, `sessions`, `accounts`, `verifications`, `tags`, `bookmarks`, `bookmark_tags` を空にする。
2. `auth.api.signUpEmail({ body: TARGET })` でユーザーを作成する。
3. `seed(db, { tagsTable, bookmarkTable, bookmarkTagsTable })` を `refine` し、作成したユーザーの ID を `userId` に固定して生成する。

## Environment

- `.env.development` に `DATABASE_URL` と `BETTER_AUTH_SECRET` が必要。
- `package.json` に `db:seed` スクリプトを追加する。

## Risks

- `drizzle-seed` は RC 版であり、リレーション生成が FK/unique 制約で失敗する可能性がある。
- 失敗した場合は中間テーブルなどを直接 INSERT するフォールバックに切り替える。
