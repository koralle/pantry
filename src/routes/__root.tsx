import "../index.css";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext } from "@tanstack/react-router";

import { RootDocument } from "../features/app-shell/components/root-document";
import { FatalErrorScreen } from "../features/not-found/fatal-error-screen";
import { NotFoundScreen } from "../features/not-found/not-found-screen";
import { fatalScreen } from "../styles/not-found";

export const Route = createRootRouteWithContext<{
  readonly queryClient: QueryClient;
}>()({
  errorComponent: () => <FatalErrorScreen />,
  notFoundComponent: () => (
    <div className={fatalScreen}>
      <NotFoundScreen />
    </div>
  ),
  shellComponent: RootDocument,
});
