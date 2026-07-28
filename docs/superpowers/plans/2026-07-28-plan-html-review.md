# Plan HTML Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a standalone, accessible HTML snapshot of the component responsibility refactor plan for easier browser review.

**Architecture:** Render the Markdown once with `marked@18.0.7`, then wrap the rendered fragment in a semantic document shell with inline CSS, generated heading anchors/table of contents, and a progressive current-section highlighter. Keep the Markdown as the source of truth and add no runtime or package dependency to Pantry.

**Tech Stack:** HTML5, CSS, minimal vanilla JavaScript, `marked@18.0.7`, Playwright.

---

## Constraints

- Source: `docs/superpowers/plans/2026-07-28-component-responsibility-refactor.md`
- Output: `docs/superpowers/plans/2026-07-28-component-responsibility-refactor.html`
- Design: `docs/superpowers/specs/2026-07-28-plan-html-review-design.md`
- Preserve the Markdown text without translation or editorial changes.
- Add no package dependency, generator script, application route, or external asset.
- Do not commit unless the user explicitly requests a commit.

### Task 1: Render The Standalone HTML Snapshot

**Files:**

- Create: `docs/superpowers/plans/2026-07-28-component-responsibility-refactor.html`
- Temporary: `/var/folders/4j/xfyytsgj1gv0v4rcnp5_3nqr0000gn/T/opencode/component-responsibility-refactor.fragment.html`
- Temporary: `/var/folders/4j/xfyytsgj1gv0v4rcnp5_3nqr0000gn/T/opencode/render-plan-html.mjs`

- [ ] **Step 1: Render the Markdown as GFM into the approved temporary directory**

Run:

```bash
npx -y marked@18.0.7 \
  --gfm \
  --input "docs/superpowers/plans/2026-07-28-component-responsibility-refactor.md" \
  --output "/var/folders/4j/xfyytsgj1gv0v4rcnp5_3nqr0000gn/T/opencode/component-responsibility-refactor.fragment.html"
```

Expected: the temporary fragment contains the complete rendered article and no `<html>`, `<head>`, or `<body>` wrapper.

- [ ] **Step 2: Create the one-off wrapper program in the approved temporary directory**

Create `/var/folders/4j/xfyytsgj1gv0v4rcnp5_3nqr0000gn/T/opencode/render-plan-html.mjs` with this complete source:

```js
import { readFileSync, writeFileSync } from 'node:fs'

const fragmentPath =
  '/var/folders/4j/xfyytsgj1gv0v4rcnp5_3nqr0000gn/T/opencode/component-responsibility-refactor.fragment.html'
const outputPath = 'docs/superpowers/plans/2026-07-28-component-responsibility-refactor.html'

const decodeEntities = (value) =>
  value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")

const escapeAttribute = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')

const slugCounts = new Map()
const headings = []
let fragment = readFileSync(fragmentPath, 'utf8')

fragment = fragment.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_, level, content) => {
  const text = decodeEntities(content.replace(/<[^>]+>/g, '')).trim()
  const base =
    text
      .normalize('NFKD')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'section'
  const count = slugCounts.get(base) ?? 0
  slugCounts.set(base, count + 1)
  const id = count === 0 ? base : `${base}-${count + 1}`
  headings.push({ level: Number(level), id, text })
  return `<h${level} id="${escapeAttribute(id)}">${content}</h${level}>`
})

fragment = fragment
  .replace(/<pre>/g, '<pre tabindex="0">')
  .replace(/<table>/g, '<div class="table-scroll" tabindex="0"><table>')
  .replace(/<\/table>/g, '</table></div>')
  .replace(/<input\b([^>]*\btype="checkbox"[^>]*)>/gi, (input, attributes) =>
    /\bdisabled\b/i.test(attributes) ? input : `<input${attributes} disabled>`
  )

let toc = '<ol>'
let hasH2 = false
let hasNestedList = false

for (const heading of headings) {
  const link = `<a href="#${escapeAttribute(heading.id)}">${escapeAttribute(heading.text)}</a>`
  if (heading.level === 2) {
    if (hasNestedList) {
      toc += '</ol>'
      hasNestedList = false
    }
    if (hasH2) toc += '</li>'
    toc += `<li>${link}`
    hasH2 = true
    continue
  }
  if (!hasNestedList) {
    toc += '<ol>'
    hasNestedList = true
  }
  toc += `<li>${link}</li>`
}

if (hasNestedList) toc += '</ol>'
if (hasH2) toc += '</li>'
toc += '</ol>'

const styles = String.raw`
:root {
  color-scheme: light;
  --canvas: #e8ece8;
  --paper: #faf7ef;
  --ink: #202522;
  --muted: #626a64;
  --rail: #1c2928;
  --rail-ink: #d8e2dd;
  --accent: #a84f35;
  --line: #d8d4c9;
  --code: #182322;
  --code-ink: #e0ece6;
  font-family: Georgia, 'Yu Mincho', 'Hiragino Mincho ProN', serif;
  line-height: 1.7;
  color: var(--ink);
  background: var(--canvas);
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; }
a { color: var(--accent); text-underline-offset: 0.18em; }
a:focus-visible, pre:focus-visible, .table-scroll:focus-visible {
  outline: 3px solid #d87554;
  outline-offset: 3px;
}

.skip-link {
  position: fixed;
  inset-block-start: 0.75rem;
  inset-inline-start: 0.75rem;
  z-index: 10;
  padding: 0.6rem 0.85rem;
  color: white;
  background: var(--accent);
  transform: translateY(-200%);
}
.skip-link:focus { transform: translateY(0); }

.document-header {
  padding: 2.5rem clamp(1.25rem, 4vw, 4rem) 1.75rem;
  color: var(--rail-ink);
  background: var(--rail);
}
.document-header p { margin: 0; font: 0.78rem/1.5 system-ui, sans-serif; }
.document-header strong {
  display: block;
  max-width: 32ch;
  margin-top: 0.35rem;
  font-size: clamp(1.45rem, 3vw, 2.6rem);
  line-height: 1.15;
  color: white;
}

.layout {
  display: grid;
  grid-template-columns: minmax(14rem, 18rem) minmax(0, 1fr);
  gap: clamp(1rem, 3vw, 3rem);
  max-width: 96rem;
  margin: 0 auto;
  padding: 2rem clamp(1rem, 3vw, 3rem) 5rem;
  align-items: start;
}

.toc {
  position: sticky;
  inset-block-start: 1rem;
  max-height: calc(100vh - 2rem);
  overflow: auto;
  padding: 1rem;
  border-radius: 0.5rem;
  color: var(--rail-ink);
  background: var(--rail);
  font: 0.82rem/1.45 system-ui, sans-serif;
}
.toc h2 { margin: 0 0 0.75rem; font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; }
.toc ol { margin: 0; padding-inline-start: 1.15rem; }
.toc > ol { padding-inline-start: 0; list-style: none; }
.toc li { margin: 0.28rem 0; }
.toc a { display: block; padding: 0.22rem 0.35rem; border-inline-start: 3px solid transparent; color: inherit; text-decoration: none; }
.toc a:hover { color: white; }
.toc a[aria-current='location'] { border-inline-start-color: #d87554; color: white; background: rgb(255 255 255 / 8%); }

main { min-width: 0; }
article {
  width: min(100%, 82ch);
  margin: 0 auto;
  padding: clamp(1.4rem, 4vw, 4rem);
  border: 1px solid var(--line);
  border-radius: 0.75rem;
  background: var(--paper);
  box-shadow: 0 1.25rem 4rem rgb(28 41 40 / 9%);
}
article > h1 { margin-top: 0; font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1.05; letter-spacing: -0.035em; }
h2, h3 { scroll-margin-top: 1rem; text-wrap: balance; }
h2 { margin-top: 3.5rem; padding-top: 1.25rem; border-top: 2px solid var(--line); font-size: clamp(1.45rem, 3vw, 2rem); line-height: 1.2; }
h3 { margin-top: 2.25rem; font-size: 1.2rem; line-height: 1.3; }
p, li { text-wrap: pretty; }
blockquote { margin-inline: 0; padding: 0.9rem 1.1rem; border-inline-start: 4px solid var(--accent); background: #fffaf1; }
hr { margin: 3rem 0; border: 0; border-top: 1px solid var(--line); }
code { font: 0.9em/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
:not(pre) > code { padding: 0.12em 0.35em; border: 1px solid var(--line); border-radius: 0.3rem; background: #f1ede4; overflow-wrap: anywhere; }
pre { max-width: 100%; overflow: auto; padding: 1rem; border-radius: 0.5rem; color: var(--code-ink); background: var(--code); }
pre code { font-size: 0.78rem; }
.table-scroll { max-width: 100%; overflow: auto; margin: 1.5rem 0; }
table { width: 100%; border-collapse: collapse; font: 0.88rem/1.45 system-ui, sans-serif; }
th, td { padding: 0.65rem 0.75rem; border: 1px solid var(--line); text-align: start; vertical-align: top; }
th { background: #eee9de; }
input[type='checkbox'] { inline-size: 1rem; block-size: 1rem; accent-color: var(--accent); }
.back-to-top { position: fixed; inset-inline-end: 1rem; inset-block-end: 1rem; padding: 0.55rem 0.75rem; border: 1px solid var(--line); border-radius: 999px; color: var(--ink); background: var(--paper); font: 0.78rem/1 system-ui, sans-serif; }

@media (max-width: 54rem) {
  html { scroll-behavior: auto; }
  .layout { grid-template-columns: 1fr; }
  .toc { position: static; max-height: none; }
  article { border-radius: 0.5rem; }
}

@media print {
  :root { background: white; }
  .document-header, .toc, .skip-link, .back-to-top { display: none; }
  .layout { display: block; max-width: none; padding: 0; }
  article { width: auto; max-width: none; padding: 0; border: 0; box-shadow: none; background: white; }
  h2, h3 { break-after: avoid-page; }
  pre, blockquote, .table-scroll { break-inside: avoid-page; }
  pre { border: 1px solid #555; color: black; background: white; white-space: pre-wrap; }
  a[href^='http']::after { content: ' (' attr(href) ')'; font-size: 0.8em; }
}
`

const script = String.raw`
const links = new Map(
  [...document.querySelectorAll('.toc a[href^="#"]')].map((link) => [
    decodeURIComponent(link.hash.slice(1)),
    link
  ])
)

const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]

    if (!visible) return

    for (const link of links.values()) link.removeAttribute('aria-current')
    links.get(visible.target.id)?.setAttribute('aria-current', 'location')
  },
  { rootMargin: '0px 0px -72% 0px', threshold: 0 }
)

for (const id of links.keys()) {
  const heading = document.getElementById(id)
  if (heading) observer.observe(heading)
}
`

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Component Responsibility Refactor Implementation Plan</title>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%231c2928'/%3E%3Cpath d='M18 18h28v7H18zm0 12h28v7H18zm0 12h19v7H18z' fill='%23faf7ef'/%3E%3C/svg%3E">
  <style>${styles}</style>
</head>
<body id="top">
  <a class="skip-link" href="#content" lang="ja">本文へ移動</a>
  <header class="document-header">
    <p>Pantry / Implementation plan</p>
    <strong>Component Responsibility Refactor</strong>
  </header>
  <div class="layout">
    <nav class="toc" aria-label="Table of contents">
      <h2 lang="ja">目次</h2>
      ${toc}
    </nav>
    <main id="content" tabindex="-1"><article>${fragment}</article></main>
  </div>
  <a class="back-to-top" href="#top" lang="ja">先頭へ戻る</a>
  <script>${script}</script>
</body>
</html>
`

writeFileSync(outputPath, html)
```

- [ ] **Step 3: Run the wrapper and remove temporary artifacts**

Run:

```bash
node "/var/folders/4j/xfyytsgj1gv0v4rcnp5_3nqr0000gn/T/opencode/render-plan-html.mjs"
rm "/var/folders/4j/xfyytsgj1gv0v4rcnp5_3nqr0000gn/T/opencode/component-responsibility-refactor.fragment.html" "/var/folders/4j/xfyytsgj1gv0v4rcnp5_3nqr0000gn/T/opencode/render-plan-html.mjs"
```

Expected: only the final HTML is added to the repository. The two temporary files no longer exist.

### Task 2: Verify Content Fidelity And Semantics

**Files:**

- Verify: `docs/superpowers/plans/2026-07-28-component-responsibility-refactor.md`
- Verify: `docs/superpowers/plans/2026-07-28-component-responsibility-refactor.html`

- [ ] **Step 1: Compare structural counts**

Verify that both documents contain:

```text
12 Task sections
1 Files That Intentionally Remain Cohesive section
1 Separate Ticket Candidates section
the same checklist item count
the same fenced code-block count
the same table count
```

Expected: every count matches; navigation-only headings are not added to the article.

- [ ] **Step 2: Validate HTML invariants in the browser DOM**

Open the output with Playwright and evaluate:

```js
;({
  h1: document.querySelectorAll('h1').length,
  duplicateIds: [...document.querySelectorAll('[id]')]
    .map((element) => element.id)
    .filter((id, index, ids) => ids.indexOf(id) !== index),
  brokenTocLinks: [...document.querySelectorAll('.toc a[href^="#"]')]
    .filter((link) => !document.getElementById(decodeURIComponent(link.hash.slice(1))))
    .map((link) => link.getAttribute('href')),
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
  "h1": 1,
  "duplicateIds": [],
  "brokenTocLinks": [],
  "unfocusableCodeBlocks": 0,
  "editableCheckboxes": 0
}
```

### Task 3: Review Responsive, Keyboard, And Print Presentation

**Files:**

- Verify: `docs/superpowers/plans/2026-07-28-component-responsibility-refactor.html`

- [ ] **Step 1: Review desktop presentation at 1440 x 1000**

Expected: the dark navigation rail remains visible, the article measure stays near 80 characters, tables and code remain within the content column, and the active table-of-contents item is visibly distinct.

- [ ] **Step 2: Review mobile presentation at 390 x 844**

Expected: the table of contents appears before the article, no page-level horizontal scrolling occurs, and tables/code scroll within their own containers.

- [ ] **Step 3: Review keyboard navigation**

Use Tab and Shift+Tab to visit the skip link, table-of-contents links, scrollable code blocks, and back-to-top link.

Expected: focus is always visible, the skip link moves focus to `main`, and no focus trap occurs.

- [ ] **Step 4: Review console and print output**

Expected: the browser console contains no errors. Print preview hides navigation and back-to-top controls, expands the article, and keeps text, tables, links, and code readable without colored backgrounds.

- [ ] **Step 5: Verify repository scope**

Run:

```bash
git status --short
git diff --check
```

Expected: the only files added for this conversion are the approved design, this implementation plan, and the standalone HTML snapshot. Existing unrelated worktree changes remain untouched.
