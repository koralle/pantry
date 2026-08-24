# Route Inline Screen Architecture Design

## Goal

Remove the thin `Route -> features/*-screen` layer from every application page. Each route owns its page-level params, search state, loader data, navigation, and page composition directly.

## Scope

- Inline the seven feature screen components into their corresponding route files:
  - bookmark detail
  - new bookmark
  - tag list
  - new tag
  - tag detail
  - tag edit
  - settings
- Inline the sign-in route's local `SignInScreen` helper into `RouteComponent`.
- Delete only the page-level `*-screen.tsx` files. Keep reusable feature components and domain/application/lib modules.
- Move source-boundary tests for new bookmark, new tag, and tag edit to assert the route files instead of deleted screen files.

## Architecture

`src/routes/**` is the page composition boundary and the Storybook Route Story entry point. A route may import reusable feature components, query options, RPC helpers, styles, and page-specific utilities, but no longer delegates the complete page to a component named `Screen`.

Reusable components remain in `src/features/**/components` when they represent a meaningful sub-piece such as `BookmarkEditor`, `TagForm`, `TagDetail`, `BookmarkList`, or `SignInWithEmailAndPasswordForm`.

## Data Flow and Errors

- Route loaders continue to own prefetching and resource promises.
- Route components continue to own route params, validated search values, navigation, mutation orchestration, and page-level error boundaries.
- Existing typed oRPC error mapping, loading states, and success navigation are moved without behavior changes.
- No new abstraction or compatibility wrapper is introduced.

## Verification

- No imports or files remain for the seven deleted `*-screen` components.
- Source-boundary tests still verify the oRPC and error-contract rules against their route sources.
- Run `pnpm run format:check`, `pnpm run lint`, `pnpm run typecheck`, `pnpm run test`, and `pnpm run build`.
