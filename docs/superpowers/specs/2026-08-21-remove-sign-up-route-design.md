# Remove the Sign-up Route

## Context

Pantry does not expose a public sign-up experience, but the application still
ships a dedicated `/sign-up` route and `SignUpScreen` component. This leaves a
dead authentication entry point in the route tree.

## Decision

Remove the sign-up route and its screen implementation entirely. `/sign-up`
must no longer be a registered application route and should resolve as a
not-found response. Do not replace it with a redirect.

## Scope

- Delete `src/routes/sign-up.tsx`.
- Delete `src/features/auth/components/sign-up-screen.tsx`.
- Regenerate `src/routeTree.gen.ts` so no sign-up route metadata remains.
- Leave Better Auth configuration, the sign-in route, and the seed script
  unchanged. The seed script provisions development data and is not a public
  sign-up flow.

## Verification

- Add a focused regression check that fails while `/sign-up` remains in the
  generated route types and passes after the route is removed.
- Review the final diff to confirm the unused `SignUpScreen` file is deleted.
- Run the project test suite.
- Run typecheck, markup lint, and the production build to verify generated
  route metadata and application compilation.
