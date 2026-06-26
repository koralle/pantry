import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'

import { routeTree } from './routeTree.gen'

export const getRouter = function getRouter() {
  const queryClient = new QueryClient()

  const router = createTanStackRouter({
    Wrap: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    ),
    context: {
      queryClient
    },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    routeTree,
    scrollRestoration: true
  })

  setupRouterSsrQueryIntegration({
    queryClient,
    router
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }

  interface HistoryState {
    newBookmarkCreated?: boolean
    newTagCreated?: boolean
    tagUpdated?: boolean
  }
}
