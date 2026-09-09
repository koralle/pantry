import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { lazy, Suspense } from "react";

import { shouldRestoreRouterScroll } from "./features/bookmarks/lib/bookmark-list-scroll-session";
import { routeTree } from "./routeTree.gen";

const QueryDevtools = import.meta.env.DEV
  ? lazy(async () => {
      const { QueryDevtools: Devtools } =
        await import("./features/app-shell/components/query-devtools");
      return { default: Devtools };
    })
  : () => null;

export const getRouter = function getRouter() {
  const queryClient = new QueryClient();

  const router = createTanStackRouter({
    Wrap: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
        {import.meta.env.DEV ? (
          <Suspense fallback={null}>
            <QueryDevtools />
          </Suspense>
        ) : null}
      </QueryClientProvider>
    ),
    context: {
      queryClient,
    },
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    routeTree,
    scrollRestoration: ({ location }) => shouldRestoreRouterScroll(location),
  });

  setupRouterSsrQueryIntegration({
    queryClient,
    router,
  });

  return router;
};

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }

  interface HistoryState {
    newBookmarkCreated?: boolean;
    newTagCreated?: boolean;
    tagUpdated?: boolean;
    bookmarkUpdated?: boolean;
    bookmarkDeleted?: boolean;
  }
}
