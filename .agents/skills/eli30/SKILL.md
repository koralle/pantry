---
name: eli30
description: Explain a topic as a picture-heavy HTML page, tuned to the user's exact level. The reader is a mid-level frontend engineer around 30, strong in TypeScript, with ~5 years of React but rusty on recent releases and shaky on TanStack mental models, and actively growing in system design and databases. Use when the user types /eli30 <topic>. Designed for Cursor and OpenCode.
metadata:
  audience: mid-level frontend engineer (user)
  agents: cursor,opencode
---

# eli30

**Explain for the user**: a mid-level frontend engineer around 30 who is strong in TypeScript and can follow real engineering reasoning, but whose knowledge is uneven in a specific, known way. Pitch every explanation to that map: skip what they know, slow down where they are weak.

## Reader profile

- **React**: ~5 years of experience, but the last 2–3 years were mostly Vue at work. Assume their React knowledge is roughly 2023-era (React 18). Name what has changed since — React 19, Server Components, the compiler, hooks and API changes — and why it matters.
- **TanStack Query / TanStack Router**: used by feel, not mastered. Do not assume a solid mental model; explain the core model and idioms, not an API tour.
- **TypeScript**: strong. Use it freely and never explain TS basics.
- **System design / databases**: the growth area, especially DB. Go slower here: build from first principles, show the data model, constraints, alternatives, and trade-offs instead of assuming them.
- **Vue**: recent hands-on experience. Use Vue analogies when they explain a concept faster than React-first ones.
- **Language**: write in Japanese.

## Ground rules

- Assume general frontend and engineering literacy outside the weak spots above. Skip the basics; never skip project-specific knowledge.
- Define every project term the first time it appears: module names, internal services, domain vocabulary, acronyms.
- Start from the problem the topic solves, then present the solution.
- Explain why, not just what: constraints, trade-offs, and history matter.
- Use the project's own vocabulary consistently; follow its glossary or domain model when one exists (e.g. `CONTEXT.md`).
- Point to files or docs to go deeper when they exist.
- Leave out anything not needed to grasp the core idea.

## Output

- Big pictures, few words. Diagrams carry the explanation; keep text short.
- One idea per section, in the order the reader can absorb.
- Match the visual language: warm editorial paper magazine — cream canvas, warm near-black ink, mono path-style eyebrows (`/problem`, `/flow`), hairline borders, no shadows, pastel accents only in diagrams. Tokens and rules: `references/design.md`; starter: `assets/template.html` (paths relative to this skill's directory).
- Produce a single self-contained HTML file (inline CSS and SVG, no external assets) named `eli30-<topic-slug>.html`, then open it in the browser (`open` on macOS, `xdg-open` on Linux, `start` on Windows).
- If the user does not want to keep the file in the project, write it to a temporary directory instead.

Topic: the topic the user passed with `/eli30`, or whatever they asked to have explained.
