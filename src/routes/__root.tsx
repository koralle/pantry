import { TanStackDevtools, type TanStackDevtoolsReactInit } from '@tanstack/react-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

const queryClient = new QueryClient()

const tanstackDevtoolsConfig = {
  position: 'bottom-right'
} satisfies TanStackDevtoolsReactInit['config']

const tanstackDevtoolsPlugins = [
  {
    name: 'Tanstack Router',
    render: <TanStackRouterDevtoolsPanel />
  }
] satisfies TanStackDevtoolsReactInit['plugins']

function RootDocument({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang='ja'>
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        <TanStackDevtools
          config={tanstackDevtoolsConfig}
          plugins={tanstackDevtoolsPlugins}
        />
        <Scripts />
      </body>
    </html>
  )
}

export const Route = createRootRoute({
  shellComponent: RootDocument
})
