# Japanese Plan HTML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Japanese standalone HTML version of the component responsibility refactor plan while preserving every technical literal and the English version.

**Architecture:** Translate only the Markdown's natural-language nodes into a temporary Japanese Markdown file, render it with the same GFM parser, then combine that fragment with the existing English HTML shell. Reuse the English heading IDs by source order so navigation remains stable, and verify structural and code-literal parity before deleting all temporary files.

**Tech Stack:** Markdown, HTML5, CSS, vanilla JavaScript, `marked@18.0.7`, Node.js, Playwright.

---

## Constraints

- Source Markdown: `docs/superpowers/plans/2026-07-28-component-responsibility-refactor.md`
- Source HTML: `docs/superpowers/plans/2026-07-28-component-responsibility-refactor.html`
- Output HTML: `docs/superpowers/plans/2026-07-28-component-responsibility-refactor.ja.html`
- Design: `docs/superpowers/specs/2026-07-28-plan-html-japanese-design.md`
- Do not modify either source file.
- Do not translate fenced code, inline code, commands, paths, identifiers, route names, URLs, state keys, or error messages.
- Do not add a repository dependency, persistent generator, build hook, or commit unless explicitly requested.

## Translation Glossary

Use these translations consistently:

| English                                  | Japanese                       |
| ---------------------------------------- | ------------------------------ |
| Goal                                     | 目的                           |
| Architecture                             | アーキテクチャ                 |
| Tech Stack                               | 技術スタック                   |
| Constraints And Invariants               | 制約と不変条件                 |
| Target File Map                          | 対象ファイル一覧               |
| Responsibility                           | 責務                           |
| Delete after migration                   | 移行後に削除                   |
| Task                                     | タスク                         |
| Step                                     | ステップ                       |
| Files                                    | 対象ファイル                   |
| Create                                   | 作成                           |
| Modify                                   | 変更                           |
| Move                                     | 移動                           |
| Delete                                   | 削除                           |
| Read                                     | 参照                           |
| Verify                                   | 検証                           |
| Temporary                                | 一時ファイル                   |
| Run                                      | 実行                           |
| Expected                                 | 期待結果                       |
| Files That Intentionally Remain Cohesive | 意図的に同居を維持するファイル |
| Separate Ticket Candidates               | 別チケット候補                 |

Keep established technical nouns such as `route`, `feature`, `shared`, `loader`, `screen`, `Hook`, `Server Function`, `ErrorBoundary`, `Suspense`, `query`, `schema`, `validator`, `barrel`, and `renderer` in their repository-facing form.

### Task 1: Create The Temporary Japanese Markdown

**Files:**

- Read: `docs/superpowers/plans/2026-07-28-component-responsibility-refactor.md`
- Create temporarily: `/var/folders/4j/xfyytsgj1gv0v4rcnp5_3nqr0000gn/T/opencode/component-responsibility-refactor.ja.md`

- [ ] **Step 1: Copy the complete Markdown structure into the temporary Japanese source**

Keep every Markdown delimiter, heading level, table row, list item, checkbox, blockquote, and fenced-code delimiter in the same order as the source.

- [ ] **Step 2: Translate natural-language prose using the fixed glossary**

Translate headings, explanatory prose, list prose, table headings/descriptions, task/step names, and run/expected labels. Preserve requirement strength:

```text
must / required -> 必須 / 〜しなければならない
must not / do not -> 禁止 / 〜してはならない
should -> 〜する
keep / preserve -> 維持する
expected -> 期待結果
```

Do not add context, examples, rationale, or implementation choices absent from the source.

- [ ] **Step 3: Protect technical literals before rendering**

Compare the English and Japanese Markdown in source order and confirm:

```text
fenced code blocks: byte-for-byte equal
inline code spans: byte-for-byte equal
URLs: byte-for-byte equal
checkbox count: equal
table count: equal
heading level sequence: equal
```

Expected: only natural-language text differs.

### Task 2: Render And Assemble The Japanese HTML

**Files:**

- Read: `docs/superpowers/plans/2026-07-28-component-responsibility-refactor.html`
- Create temporarily: `/var/folders/4j/xfyytsgj1gv0v4rcnp5_3nqr0000gn/T/opencode/component-responsibility-refactor.ja.fragment.html`
- Create temporarily: `/var/folders/4j/xfyytsgj1gv0v4rcnp5_3nqr0000gn/T/opencode/render-plan-html-ja.mjs`
- Create: `docs/superpowers/plans/2026-07-28-component-responsibility-refactor.ja.html`

- [ ] **Step 1: Render the temporary Japanese Markdown as GFM**

Run:

```bash
npx -y marked@18.0.7 \
  --gfm \
  --input "/var/folders/4j/xfyytsgj1gv0v4rcnp5_3nqr0000gn/T/opencode/component-responsibility-refactor.ja.md" \
  --output "/var/folders/4j/xfyytsgj1gv0v4rcnp5_3nqr0000gn/T/opencode/component-responsibility-refactor.ja.fragment.html"
```

Expected: a complete article fragment without document shell.

- [ ] **Step 2: Create the one-off assembler**

The assembler must perform these operations and throw on every count mismatch:

```js
const englishHeadingPattern = /<h([23])\s+id="([^"]+)">([\s\S]*?)<\/h\1>/g
const japaneseHeadingPattern = /<h([23])>([\s\S]*?)<\/h\1>/g
const englishArticlePattern = /<article>([\s\S]*?)<\/article>/
const tocPattern = /<nav class="toc"[^>]*>[\s\S]*?<\/nav>/
```

Use the English heading IDs in source order. Reject a level mismatch. Add `tabindex="0"` to `pre`, wrap `table` in the same `.table-scroll` container, and keep checkbox inputs disabled.

Generate the Japanese table of contents from translated heading text with the same nested `h2`/`h3` algorithm used by the English renderer.

Transform the English shell exactly as follows:

```text
<html lang="en"> -> <html lang="ja">
English <title> -> コンポーネント責務分割 実装計画
Pantry / Implementation plan -> Pantry / 実装計画
Component Responsibility Refactor -> コンポーネント責務分割
aria-label="Table of contents" -> aria-label="目次"
English nav -> generated Japanese nav
English article -> rendered Japanese article
output path -> 2026-07-28-component-responsibility-refactor.ja.html
```

The assembler must leave the inline CSS, favicon, current-section script, skip link, and back-to-top link unchanged.

- [ ] **Step 3: Run the assembler and format the output**

Run:

```bash
node "/var/folders/4j/xfyytsgj1gv0v4rcnp5_3nqr0000gn/T/opencode/render-plan-html-ja.mjs"
pnpm exec oxfmt "docs/superpowers/plans/2026-07-28-component-responsibility-refactor.ja.html"
```

Expected: one formatted Japanese standalone HTML file is added.

### Task 3: Verify Translation And Structural Parity

**Files:**

- Verify: `docs/superpowers/plans/2026-07-28-component-responsibility-refactor.html`
- Verify: `docs/superpowers/plans/2026-07-28-component-responsibility-refactor.ja.html`

- [ ] **Step 1: Compare structural counts**

Expected in both files:

```text
h1: 1
Task sections: 12
checkboxes: 59
code blocks: 35
tables: 6
Files That Intentionally Remain Cohesive / 意図的に同居を維持するファイル: 1
Separate Ticket Candidates / 別チケット候補: 1
```

- [ ] **Step 2: Compare protected literals in source order**

Extract and compare:

```text
every pre > code textContent
every inline code textContent outside pre
every href beginning with http
every file/route path represented as inline code
```

Expected: all arrays are deeply equal between English and Japanese versions.

- [ ] **Step 3: Detect untranslated prose**

Inspect Japanese headings, paragraphs, list prose, blockquotes, table headings, and non-code table cells. Flag English sequences of four or more ordinary words while excluding protected technical literals and the fixed product/package vocabulary.

Expected: no untranslated English sentence remains outside protected technical content.

- [ ] **Step 4: Validate Japanese DOM invariants**

Evaluate:

```js
;({
  lang: document.documentElement.lang,
  h1: document.querySelectorAll('h1').length,
  duplicateIds: [...document.querySelectorAll('[id]')]
    .map((element) => element.id)
    .filter((id, index, ids) => ids.indexOf(id) !== index),
  brokenTocLinks: [...document.querySelectorAll('.toc a[href^="#"]')].filter(
    (link) => !document.getElementById(decodeURIComponent(link.hash.slice(1)))
  ).length,
  unfocusableCodeBlocks: [...document.querySelectorAll('pre')].filter((pre) => pre.tabIndex !== 0)
    .length,
  editableCheckboxes: [...document.querySelectorAll('input[type="checkbox"]')].filter(
    (input) => !input.disabled
  ).length
})
```

Expected:

```json
{
  "lang": "ja",
  "h1": 1,
  "duplicateIds": [],
  "brokenTocLinks": 0,
  "unfocusableCodeBlocks": 0,
  "editableCheckboxes": 0
}
```

### Task 4: Review Presentation And Clean Up

**Files:**

- Verify: `docs/superpowers/plans/2026-07-28-component-responsibility-refactor.ja.html`
- Delete temporary: the Japanese Markdown, fragment, and assembler under `/var/folders/4j/xfyytsgj1gv0v4rcnp5_3nqr0000gn/T/opencode/`

- [ ] **Step 1: Review desktop and mobile layouts**

Verify at 1440 x 1000 and 390 x 844:

```text
page-level horizontal overflow: 0
desktop TOC position: sticky
mobile TOC position: static
inline paths wrap within the article
tables and code scroll inside their own containers
```

- [ ] **Step 2: Review keyboard, current section, console, and print**

Expected: skip link focuses `main`, all focus indicators are visible, TOC current-section highlighting follows scroll position, console errors are 0, and print media hides navigation while keeping prose/code readable on white.

- [ ] **Step 3: Remove all temporary generation files**

Delete only:

```text
/var/folders/4j/xfyytsgj1gv0v4rcnp5_3nqr0000gn/T/opencode/component-responsibility-refactor.ja.md
/var/folders/4j/xfyytsgj1gv0v4rcnp5_3nqr0000gn/T/opencode/component-responsibility-refactor.ja.fragment.html
/var/folders/4j/xfyytsgj1gv0v4rcnp5_3nqr0000gn/T/opencode/render-plan-html-ja.mjs
```

- [ ] **Step 4: Run final verification**

Run:

```bash
pnpm run test
pnpm exec oxfmt --check \
  "docs/superpowers/plans/2026-07-28-component-responsibility-refactor.html" \
  "docs/superpowers/plans/2026-07-28-component-responsibility-refactor.ja.html"
git diff --check
git status --short
```

Expected: 38 tests pass, both HTML files are formatted, no whitespace errors are reported, only approved documentation files are added, and unrelated worktree files remain untouched.
