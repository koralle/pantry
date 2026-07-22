import '../index.css'
import type { TanStackDevtoolsReactInit } from '@tanstack/react-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import type { QueryClient } from '@tanstack/react-query'
import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { css } from 'styled-system/css'

const tanstackDevtoolsConfig = {
  position: 'bottom-right'
} satisfies TanStackDevtoolsReactInit['config']

const tanstackDevtoolsPlugins = [
  {
    name: 'Tanstack Router',
    render: <TanStackRouterDevtoolsPanel />
  }
] satisfies TanStackDevtoolsReactInit['plugins']

const bodyClassName = css({
  margin: '0',
  backgroundColor: 'canvas',
  color: 'text',
  fontFamily: 'sans',
  fontSize: 'body',
  fontWeight: 'normal',
  lineHeight: 'normal',
  fontSmoothing: 'antialiased',
  textSizeAdjust: '100%'
})

function RootDocument({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang='ja'>
      <head>
        <HeadContent />
      </head>
      <body className={bodyClassName}>
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
