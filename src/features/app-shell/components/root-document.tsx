import type { TanStackDevtoolsReactInit } from '@tanstack/react-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { HeadContent, Scripts } from '@tanstack/react-router'
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

export function RootDocument({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang='ja'>
      <head>
        <meta charSet='utf-8' />
        <title>Pantry</title>
        {import.meta.env.DEV ? (
          <script
            crossOrigin='anonymous'
            src='//unpkg.com/react-scan/dist/auto.global.js'
          />
        ) : null}
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
