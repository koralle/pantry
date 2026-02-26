# Pantry Context Playbook

## Table of Contents
1. Current Product Context
2. Pantry-Specific Question Bank
3. Key Trade-off Frames
4. MVP Slice Suggestions
5. Pantry Spec Addendum Template

## Current Product Context

Use these as working assumptions unless the user says otherwise:
- Product: personal-only, minimalist, tag-based bookmark manager
- Frontend stack: TanStack Start + React + TypeScript
- Runtime/deploy direction: Cloudflare Workers (Wrangler configured)

Always confirm assumptions before locking decisions.

## Personal-Only Default Policy

Apply these defaults when no contrary requirement exists:
- Single user, no collaboration, no team roles
- Authentication can be lightweight if environment is private
- Sharing, ACL, invitations, multi-tenant design are out of MVP scope
- Prioritize speed-to-save and re-findability over social/distribution features

## Pantry-Specific Question Bank

### A. User and Value
- 主要ユーザーは「自分のみ」で固定してよいか？（変更要求が出るまで固定）
- 保存対象は主に記事・動画・ドキュメント・SNSのどれか？
- 既存の不満は「保存しにくい」「後で見つからない」「再訪しない」のどれが最大か？
- Pantry を使う成功状態は何か？（例: 30秒以内に再発見できる）

### B. Capture Flow (保存導線)
- 保存導線は何を優先するか？（手入力 / ブックマークレット / 拡張機能 / 共有シート）
- URL貼り付け時に自動取得するメタデータは何が必要か？（title, description, image, site name）
- 保存時の最小入力は何か？（URLのみ / URL+タグ / URL+メモ）
- 同一URLの重複検知ルールは？（厳密一致 / 正規化一致 / ドメイン+パス）

### C. Tagging Model (タグ設計)
- タグは自由入力のみか、候補/補完を持つか？
- タグの同義語・揺れをどう扱うか？（別タグ許容 / 統合辞書 / alias）
- タグ階層は必要か？（flat優先か、親子タグ対応か）
- タグ0件・タグ過多時のUXをどうするか？

### D. Retrieval UX (検索・再発見)
- 主導線は検索ボックスかタグフィルタか？
- AND/OR/NOT 条件はどこまでMVPに入れるか？
- 並び替え軸は何が必要か？（保存日 / 最終閲覧 / タイトル）
- 「また見るべき」導線を入れるか？（未読/最近保存/長期未閲覧）

### E. Metadata and Content Quality
- OGP取得失敗時のフォールバック表示は？
- ページタイトル変更やリンク切れにどう対応するか？
- 言語混在コンテンツをどう扱うか？
- サムネイルや説明文の手動編集は許可するか？

### F. Privacy and Security
- データは完全に個人利用前提で固定してよいか？
- 外部サービス連携時の送信データ最小化ポリシーは？
- 削除の意味は論理削除か物理削除か？
- エクスポート/バックアップ要件は必要か？

### G. Delivery and Operations
- 最初のリリース対象はWebのみか、モバイル保存導線も含むか？
- 障害時に最低限守るべき機能は何か？（保存不可は致命か）
- 監視したいイベントは何か？（save success rate, search latency）
- 将来機能（AIタグ提案、重複統合）を先に設計へ織り込むか？

## Key Trade-off Frames

Use these comparison lenses in discussions:

1. 入力最小化 vs 情報リッチ化
   - URLだけ即保存すると離脱は減るが、後で探しにくくなる
2. 自由タグ vs 制御タグ
   - 自由度は高いがタグ品質が崩れやすい
3. 個人最適 UX vs 将来拡張余地
   - 個人最適を優先しつつ、将来拡張点だけ境界として残す
4. 厳密重複排除 vs 柔軟保存
   - 厳密に排除すると意図的な重複保存ユースケースを潰しうる
5. MVP速度 vs 可観測性
   - 先に出すほど運用観測が弱くなり、改善判断が遅れる

## MVP Slice Suggestions

Start with the thinnest slice that validates value:

### Slice 1: Capture + Basic Retrieval
- URL保存
- 手動タグ付け
- 一覧表示
- タグで絞り込み

### Slice 2: Findability Upgrade
- フリーワード検索（title/url/tag）
- 並び替え
- 重複通知（警告のみ）

### Slice 3: Quality and Reliability
- OGP取得と失敗フォールバック
- 編集・アーカイブ
- エクスポート（JSON/CSV）

### Explicitly Out of Scope (for now)
- 共有リンク
- 共同編集
- 組織/チーム管理
- ロールベースアクセス制御

## Pantry Spec Addendum Template

Append this to the generic spec template when discussing Pantry.

```md
## Pantry Addendum

### Capture Rules
- Required on save:
- Optional on save:
- Duplicate handling:

### Tag Rules
- Tag format constraints:
- Alias/synonym policy:
- Suggested tags source:

### Retrieval Rules
- Default list sort:
- Filter operators:
- Empty result behavior:

### Quality/Integrity Rules
- Metadata fetch timeout:
- Broken link handling:
- Edit history/audit need:

### KPIs
- Save success rate target:
- Median search response target:
- Re-find success proxy metric:
```
