# Pantry verification map

This directory is the maintained source for verifying Pantry's signed-in web UI. Read this index, then follow one feature file. Launch and doctor live in `../SKILL.md`.

## Baseline preconditions

- The isolated app is healthy at `http://127.0.0.1:4173`.
- libSQL is `http://127.0.0.1:18080` in container `pantry-verify-turso`.
- Seed user `koralle@example.com` / `password` can sign in.
- The bookmark list already contains seeded rows, including the pinned tag `typescript`.
- `doctor.sh` reports the expected URL, database, and Vite pid.
- Never drive port 3000 or port 8080 from this skill.

## Driving conventions

- Start from the seeded, signed-in baseline unless the feature file says otherwise.
- Use the Cursor IDE browser. Prefer ARIA roles and accessible names.
- Desktop viewport is 1280×800 so the header link `登録` is visible.
- Keep quoted names unchanged.
- Do not delete `artifacts/` during cleanup.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof is an ARIA snapshot and a screenshot that shows Pantry or the page heading.
- Mutation proof includes a second view of the bookmark and `query-url.sh` output from port 18080.
- Record the feature id and entry point in `artifacts/<feature-id>/notes.txt`.
- If an entry point is unreachable, report the command and the missing precondition. Do not mark it verified through a different path.

## Feature entry contract

Each feature file has an H1, one intro paragraph, then exactly these H2 sections in order: `Sub-features`, `How to get to it (user POV)`, `Driving it with verify-pantry`, `Gotchas`.

## Features

- [Sign in](./sign-in.md) covers email sign-in, a wrong password, and the redirect to the bookmark list.
- [Quick add](./quick-add.md) covers the header and bottom-tab entry, save, and the detail view.
- [Register from the full form](./register-bookmark.md) covers `/bookmarks/new` when the list is empty and when opened directly.
- [Bookmark list](./bookmark-list.md) covers recent, inbox, and favorites.
- [Tags](./tags.md) covers the tag manager, search, and creating a tag.
