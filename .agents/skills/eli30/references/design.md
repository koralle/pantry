# eli30 visual language

Warm, editorial, type-designer: a developer-tool page that reads like a literary magazine. Cream paper canvas, warm near-black ink, mono path-style eyebrows, hairline borders, no shadows, and pastel accents used sparingly. Adapted from the Tavily DESIGN.md.

## Canvas

- One warm canvas from top to bottom. No dark mode, no stark white, no flat gray.
- Background `#fefcf5`; surface lifts (cards, feature bands) `#fffcf6`.
- Text `#3c3a39` (warm near-black), never pure black.
- Secondary text `rgba(11,9,7,0.6)`; tertiary `rgba(11,9,7,0.4)`; disabled `rgba(11,9,7,0.2)`.
- Subtle borders `rgba(11,9,7,0.1)`; faintest surface `rgba(11,9,7,0.05)`; dividers `#eaeae2`; section tint `#f7f7f5`.
- No box-shadow. Depth comes from hairline borders and surface tints.

## Accents

Reserve them for diagrams, data series, endpoints, and highlights. The accents punch because the canvas stays calm.

`#ff272d` red (problem) · `#ff7300` orange · `#ffc753` yellow · `#fdc211` primary yellow · `#f49eff` pink · `#817fff` lavender (alternative) · `#2677ff` blue (data / links) · `#aaf2fc` aqua · `#79deeb` turquoise · `#32ae88` success green.

## Type

- One sans for everything: `"Suisse Int'l", -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif`.
- Mono for eyebrows and path-like labels: `"Suisse Int'l Mono", ui-monospace, SFMono-Regular, Menlo, monospace`.
- Fluid scale with `clamp()`, no breakpoint jumps:
  - Display `clamp(2.5rem, 5vw, 4.7rem)`, weight 500, line-height 1, letter-spacing `-0.02em`
  - Section heading `clamp(1.6rem, 2.6vw, 2.6rem)`, weight 400, line-height 1.05
  - Body `clamp(1.05rem, 1.4vw, 1.375rem)`, line-height 1.6; small 18px; caption 15px
- Mono eyebrow at 15px, styled like a CLI path: `/problem`, `/mental-model`, `/flow`, `/trade-offs`.
- Tight display headings, gentle negative tracking; body stays generous.

## Layout

- Content max width 1440px; page padding 100px on desktop, 50px below ~900px.
- Sections own their padding: 50px 0 by default; feature blocks up to 80px 100px.
- Generous whitespace, one idea per section.
- Cards: `#fffcf6`, 1px border `rgba(11,9,7,0.1)`, radius 12px (feature cards 14–20px).
- Chips and badges: radius 2px–9999px, tinted fill `rgba(11,9,7,0.05)` or an accent wash.

## Diagrams

- Inline SVG only. Hairline strokes (1px, `rgba(11,9,7,0.4)`), circles and rounded rects for nodes, mono labels.
- Code concepts by accent (blue = data, red = problem, lavender = alternative).
- Abstract node/flow illustrations. No photography, no screenshots.

## Code

- Mono on `rgba(11,9,7,0.05)`, radius 8px, hairline border. Syntax accents from the palette.
- Keep listings short. The page is for concepts, not full source.

## Motion

- Quiet. Hover: text shifts 2–4px while its arrow shifts the other way; card borders darken from `rgba(11,9,7,0.1)` to `rgba(11,9,7,0.4)`.
- Optional mouse-tracked spotlight: `radial-gradient(at var(--x) var(--y), accent, transparent)`.
- No bouncy easing, no parallax. Respect `prefers-reduced-motion`.
