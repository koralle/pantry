import '../app.css'
import type { TanStackDevtoolsReactInit } from '@tanstack/react-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import type { QueryClient } from '@tanstack/react-query'
import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

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
        {children}
        <TanStackDevtools
          config={tanstackDevtoolsConfig}
          plugins={tanstackDevtoolsPlugins}
        />
        <Scripts />
      </body>
    </html>
  )
}

export const Route = createRootRouteWithContext<{ readonly queryClient: QueryClient }>()({
  shellComponent: RootDocument
})
