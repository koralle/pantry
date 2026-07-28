# 実装計画HTML 日本語版設計

## 目的

`docs/superpowers/plans/2026-07-28-component-responsibility-refactor.html` の構造とレビュー機能を維持したまま、日本語で読める別HTMLを作成する。

## 成果物

- `docs/superpowers/plans/2026-07-28-component-responsibility-refactor.ja.html` を追加する。
- 既存の英語HTMLと英語Markdownは変更しない。
- 日本語版は単一の自己完結HTMLとし、外部assetやnetwork requestを持たない。
- 翻訳用Markdownとrendererは承認済み一時領域にだけ置き、生成後に削除する。
- package dependency、generator script、build hookは追加しない。

## 翻訳範囲

次の自然文を日本語化する。

- document titleとheader
- 見出し
- 目的、設計、制約、説明文
- 箇条書き
- 表の見出しと説明列
- Task名、Step名、`Run`、`Expected`などの手順ラベル
- 注意事項と別チケット候補

次の技術要素は原文を保持する。

- fenced code blockの全内容
- inline code
- shell commandと引数
- file path、route path、URL
- package名、型名、関数名、変数名、property名
- error class、error message、navigation state key
- CSS selectorとHTML attribute

## 文体

- 実装者が判断せず実行できる、簡潔な技術文書として訳す。
- 原文の命令、禁止、期待結果の強さを維持する。
- 技術語を無理に和訳せず、repository内で使われている英語表記を保持する。
- 原文にない説明、背景、感情、比喩を追加しない。
- 同じ用語は文書全体で同じ日本語を使う。

## HTML構造

- `<html lang="ja">` を設定する。
- 日本語の`title`、header、目次ラベル、skip link、先頭リンクを使う。
- 英語版と同じlandmark、heading hierarchy、table、list、blockquote、code構造を維持する。
- 英語版と同じCSS、responsive layout、print CSS、faviconを使う。
- 英語版と同じcurrent-section scriptを使う。
- code blockとtableのkeyboard focusを維持する。
- checkboxはdisabledの読み取り専用表示を維持する。

## 見出しIDと目次

- 英語版HTMLから`article h2[id]`と`article h3[id]`を出現順に取得する。
- 日本語fragmentの同じ順番の見出しへ英語版のIDを割り当てる。
- 日本語の見出し本文から目次ラベルを生成する。
- 見出し数が英語版と一致しない場合は生成を失敗させる。
- すべての目次linkが一意な見出しIDを参照することを検証する。

## 生成フロー

1. 英語Markdownを構造を変えず日本語へ翻訳し、一時Markdownとして保存する。
2. 一時Markdownを`marked@18.0.7`でGFM fragmentへ変換する。
3. 英語版の見出しIDを日本語fragmentへ移植する。
4. 英語版と同じdocument shell、CSS、navigation scriptで包む。
5. 日本語HTMLを書き出す。
6. 構造・コード・表示を検証する。
7. 一時Markdown、fragment、rendererを削除する。

## 失敗条件

次の場合は成果物を完成扱いにしない。

- 英語版と日本語版でheading数が異なる。
- Task、checkbox、code block、tableの数が異なる。
- code blockまたはinline codeの内容が変わる。
- duplicate IDまたは壊れた目次linkがある。
- 技術要素以外の長い英語文が残る。
- desktopまたはmobileでpage-level horizontal overflowが発生する。
- browser consoleにerrorが出る。

## 検証

- h1/h2/h3の数を英語版と比較する。
- Task 12件、checkbox 59件、code block 35件、table 6件を確認する。
- code blockとinline codeを出現順に比較する。
- heading ID、目次link、disabled checkbox、focus可能なcode blockをDOMで検査する。
- 1440 x 1000と390 x 844で表示を確認する。
- skip link、目次、code block、先頭リンクをkeyboardで確認する。
- print mediaでnavigationが消え、本文とcodeが白背景で読めることを確認する。
- console errorが0件であることを確認する。

## 対象外

- 英語版HTMLまたは英語Markdownの変更
- 日英併記
- 翻訳状態の永続化
- 将来の自動同期
- full-text searchやTask折り畳み
- Pantry applicationへの組み込み
