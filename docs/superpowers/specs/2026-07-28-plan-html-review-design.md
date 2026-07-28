# Implementation Plan HTML Review Design

## Purpose

Convert `docs/superpowers/plans/2026-07-28-component-responsibility-refactor.md` into a review-friendly HTML snapshot without changing or translating its content.

## Output

- Create `docs/superpowers/plans/2026-07-28-component-responsibility-refactor.html`.
- Produce one standalone HTML file that opens directly from the filesystem.
- Inline all CSS and JavaScript.
- Do not add a package dependency, generator script, build hook, or CDN resource.
- Treat the Markdown file as the source of truth and the HTML file as a one-time review snapshot.

## Content Fidelity

- Preserve the Markdown text in English.
- Preserve heading order and hierarchy.
- Preserve lists, checkboxes, tables, blockquotes, inline code, fenced code blocks, and horizontal rules.
- Preserve the 12 task sections and the separate-ticket section.
- Render checklist controls as read-only; do not persist review state.
- Add Japanese labels only to navigation aids that do not replace source content.

## Document Structure

- Use `<!doctype html>` and responsive viewport metadata.
- Set the document language to English because the source content is English.
- Mark Japanese navigation labels with `lang="ja"`.
- Place a skip link before repeated navigation.
- Use `header`, `nav`, `main`, and `article` landmarks.
- Keep one `h1`; preserve sequential `h2` and `h3` levels from the Markdown.
- Render data tables with their native table semantics.
- Render fenced code as `pre > code` and add `tabindex="0"` to horizontally scrollable `pre` elements.

## Visual Design

- Use the approved technical-document presentation.
- Use a warm ivory reading surface, dark green navigation rail, and restrained rust accent.
- Limit prose measure to approximately 80 characters.
- Use system fonts only. Use a serif stack for document headings/body and a system sans-serif stack for navigation and metadata.
- Use a monospace system stack for code.
- Keep contrast at or above 4.5:1 for normal text and provide a visible `:focus-visible` outline.
- Avoid animation; no reduced-motion fallback is required for static transitions.

## Navigation And Responsive Behavior

- Generate a table of contents from `h2` and `h3` headings.
- Keep the table of contents visible in a sticky side rail on wide screens.
- Place the table of contents above the article on narrow screens.
- Use anchor links as the primary navigation mechanism.
- Use a small inline script to highlight the current section while scrolling.
- Keep all anchor navigation functional when JavaScript is disabled.
- Include a visible link back to the top of the document.

## Print Behavior

- Hide navigation, skip links, and back-to-top controls in print.
- Expand the article to the printable width.
- Avoid breaking headings from their following content where practical.
- Keep code blocks and tables readable without relying on background color.
- Show link destinations in print only when the link points outside the document.

## Failure Boundaries

- The document has no network dependency and must remain usable offline.
- Failure of the current-section script must not hide or block any content.
- Long paths, tables, and code lines must scroll rather than overflow the page.
- Narrow viewport rendering must not require horizontal page scrolling.

## Verification

- Compare the HTML against the Markdown for heading, task, table, checklist, and code-block coverage.
- Verify one `h1` and sequential heading levels.
- Verify all table-of-contents links resolve to unique heading IDs.
- Open the file at desktop and mobile widths.
- Navigate the skip link, table of contents, code blocks, and back-to-top link using the keyboard.
- Confirm visible focus styling and no browser console errors.
- Inspect print preview to confirm navigation is removed and content remains readable.

## Out Of Scope

- Translating or editing the implementation plan.
- Synchronizing future Markdown edits.
- Persisting checklist state.
- Full-text search or task-section collapsing.
- Adding application routes or integrating the snapshot into Pantry.
