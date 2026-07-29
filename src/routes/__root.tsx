import '../index.css'
import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext } from '@tanstack/react-router'

import { RootDocument } from '../features/app-shell/components/root-document'

export const Route = createRootRouteWithContext<{ readonly queryClient: QueryClient }>()({
  shellComponent: RootDocument
})
