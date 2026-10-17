---
name: verify-pantry
description: Drive the Pantry bookmark manager in a browser against an isolated local libSQL and prove a user-facing flow. Use when a change to sign-in, bookmarks, quick add, the bookmark list, or tags needs evidence from the running app.
---

# Verify Pantry

Pantry is a signed-in web app (TanStack Start on Vite, port 4173 for verification). The user-facing surface is the browser. Storybook on port 6006 is a separate surface and is not this skill.

The development database in `apps/web/.env.development` is `http://127.0.0.1:8080`. Never migrate, seed, or drive that instance. `apps/web/scripts/seed.ts` calls `drizzle-seed` `reset` and deletes every row in the database it connects to.

## Launch

From the repo root, start it in a session that stays open. The script prints `ready` and then waits until Vite exits. Cleanup stops that process.

```bash
.cursor/skills/verify-pantry/scripts/launch.sh
```

The Vite plugin reads `apps/web/.env.development` itself. `varlock run -p` does not change that, so `launch.sh` writes a temporary `apps/web/.env.development.local` marked `pantry-verify-override` and `cleanup.sh` deletes that file. Launch refuses if that file already exists, or if something is listening on port 3000, because a running `pnpm dev` could reload the override and leave the development database.

1. Starts Compose project `pantry-verify` (container `pantry-verify-turso`, host port 18080, tmpfs data dir).
2. Waits until `curl -sf http://127.0.0.1:18080/health` succeeds.
3. Runs Drizzle migrations from `packages/db` and `apps/web/scripts/seed.ts` against that URL only.
4. Starts `vite dev --port 4173 --host 127.0.0.1` with the same Varlock overlay. The pid is `.cursor/skills/verify-pantry/run/vite.pid`. The log is `.cursor/skills/verify-pantry/run/vite.log`.

Ready means `http://127.0.0.1:4173/sign-in` returns HTML containing `Pantry`, not merely that a process is listening. Seed creates the signed-in user `koralle@example.com` / `password` and about 240 bookmarks. Two verification runs cannot share this instance: the container name, port 18080, and port 4173 are fixed. If launch says vite is already running, run cleanup first.

## Doctor

```bash
.cursor/skills/verify-pantry/scripts/doctor.sh
```

Run this before driving whenever something looks wrong. It checks the resolved database URL, `BETTER_AUTH_URL=http://127.0.0.1:4173`, that container `pantry-verify-turso` is running, libSQL `/health`, the sign-in page, and the recorded Vite pid. It does not start or stop anything.

## Drive

Use the Cursor IDE browser against `http://127.0.0.1:4173`. Prefer ARIA roles and accessible names. Set a desktop viewport (1280×800) before looking for the header link `登録`; below the `md` breakpoint that link is hidden and the bottom tab `ブックマークを登録` opens quick add instead.

Read `.cursor/skills/verify-pantry/features/README.md` and the feature file before driving. Start from the seeded baseline unless that file says otherwise.

Sign in once per browser context:

1. Open `http://127.0.0.1:4173/sign-in`.
2. Fill the textbox named `メール` with `koralle@example.com`.
3. Fill the textbox named `パスワード` with `password`.
4. Click the button named `サインイン`.
5. The next page is the bookmark list. The navigation `ビュー` contains `最近保存したもの`.

Do not use the passkey button. Do not call internal RPC clients or test-only setters. Title fetch (`タイトルを取得`) contacts the URL's host; for a proof, type the title or accept the domain fallback instead of treating a fetched title as the assertion.

## Evidence

Write proof under `.cursor/skills/verify-pantry/artifacts/<feature-id>/`. Capture the action and the resulting state.

- An ARIA snapshot saved as `*.aria.txt`.
- A screenshot saved as `*.png` that shows the Pantry wordmark or the page heading.
- For a mutation, a second user-facing view of the stored bookmark (open `詳細を見る` or the row in `最近保存したもの`) plus one read of the isolated database:

```bash
.cursor/skills/verify-pantry/scripts/query-url.sh 'https://example.com/pantry-verify-proof'
```

The script prints matching rows from `http://127.0.0.1:18080` only. A row that exists only in the screenshot is not persistence proof. A row that is missing from this database means the app wrote somewhere else; stop and do not claim success.

Record the feature id and the entry point in `notes.txt` next to the artifacts.

## Cleanup

```bash
.cursor/skills/verify-pantry/scripts/cleanup.sh
```

This kills the pid in `run/vite.pid` and runs `docker compose --project-name pantry-verify down`. It does not delete `artifacts/`. After cleanup, the proof files must still be on disk. Never kill processes by name, and never compose-down the default project `pantry`.

## Helpers

- `.cursor/skills/verify-pantry/scripts/launch.sh` starts the isolated stack.
- `.cursor/skills/verify-pantry/scripts/doctor.sh` checks that stack.
- `.cursor/skills/verify-pantry/scripts/query-url.sh <url>` reads bookmark rows for that URL from port 18080.
- `.cursor/skills/verify-pantry/scripts/cleanup.sh` stops the stack and keeps artifacts.
