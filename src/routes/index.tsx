import { createFileRoute } from '@tanstack/react-router'

function App() {
  return <h1>Hello, world</h1>
}

export const Route = createFileRoute('/')({ component: App })
