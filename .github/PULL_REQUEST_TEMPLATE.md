## Summary
<!-- 何を・なぜ変えたか。1〜3行 -->

## Test plan
- [ ] `pnpm run format:check`
- [ ] `pnpm run lint`
- [ ] `pnpm run typecheck`
- [ ] `pnpm run test`
- [ ] `pnpm run build`

<!-- 該当するものだけ残す。不要ならセクションごと削除 -->

## Schema / migration
- [ ] Drizzle マイグレーションを追加・適用した（`pnpm run migrate:dev`）
- [ ] 本番適用手順が分かっている（または follow-up を書いた）

## Auth / security
- [ ] Server Function 内で認証を確認している
- [ ] `user_id` で他ユーザーのデータに触れない
- [ ] 自己サインアップ経路を増やしていない

## Server Function / domain
- [ ] 入力検証・タグ正規化（trim / 小文字 / 上限）を通している
- [ ] 書き込みはトランザクション境界が明確
- [ ] 認可・重複・ソフトデリートなど、触ったルールのテストを追加/更新した

## UI
- [ ] 一覧 / 登録 / 編集など触ったフローを手動確認した
- [ ] デスクトップとモバイル幅で主要操作できる
- [ ] エラーが利用者に見える
