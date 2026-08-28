# Passkey Sign-In Implementation Plan

> **For agentic workers:** Execute this plan task-by-task with TDD. The spec is GitHub Issue #245.

**Goal:** Let signed-in users register and manage passkeys, and sign in with a registered passkey without entering email or password, while keeping email + password working.

**Architecture:** Add Better Auth's `@better-auth/passkey` plugin to the existing Cookie session auth. Do not put passkey ceremonies behind oRPC. RP ID and origin come from `BETTER_AUTH_URL`. Display names are resolved at read time (user name, else authenticator AAGUID name, else `パスキー`).

**Tech Stack:** Better Auth 1.6.27, `@better-auth/passkey`, Drizzle/Turso, TanStack Start, Storybook play functions, Vitest

**Spec:** GitHub Issue #245 (current issue body is the source of truth)

## Global Constraints

- Do not remove or weaken email + password auth.
- Do not add passkey-only signup, unauthenticated registration, social login, or step-up auth on delete.
- Passkey register / list / rename / delete target only the current authenticated user.
- Server stores public key material only; never private keys.
- Progressive enhancement: if WebAuthn is unavailable, hide passkey actions and keep password login.
- Conditional UI must not block the password form. Abort it when the user starts explicit passkey sign-in or leaves the page.
- Accessible names and `role="alert"` / `role="status"` for success and failure.
- Dates in Asia/Tokyo, same as the rest of the app.

## File map

- Modify: `pnpm-workspace.yaml`, `package.json` — add `@better-auth/passkey@1.6.27`
- Modify: `src/db/schema/auth-schema.ts` — `passkey` model, table `passkeys`
- Create: drizzle migration for `passkeys`
- Modify: `auth.ts`, `src/features/auth/server/get-auth.server.ts` — `passkey()` plugin
- Modify: `src/features/auth/lib/auth-client.ts` — `passkeyClient()`
- Create: display-name / WebAuthn support / error helpers under `src/features/auth/lib/`
- Create: `src/features/auth/components/passkey-sign-in.tsx`
- Modify: `src/routes/sign-in/index.tsx` and stories
- Create: settings passkey section components
- Modify: `src/routes/_protected/settings/index.tsx`
- Modify: Storybook auth-client mock

## Implementation notes

- `addPasskey()` is called without a name so stored `name` stays empty until the user renames.
- Cancel codes (`AUTH_CANCELLED`, `ERROR_CEREMONY_ABORTED`, `REGISTRATION_CANCELLED`) stay on the current screen and do not add or remove passkeys.
- SimpleWebAuthn aborts a previous ceremony when a new one starts; still ignore AUTH_CANCELLED from the Conditional UI promise.
- Do not persist authenticator names into `name`. Resolve with `getAuthenticatorName` at render time.
