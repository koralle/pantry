import { createFileRoute } from '@tanstack/react-router'

function LoginPage() {
  return <h1>Login</h1>
}

export const Route = createFileRoute('/login')({ component: LoginPage })
