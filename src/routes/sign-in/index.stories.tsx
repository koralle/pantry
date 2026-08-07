import { expect, mocked, userEvent, within } from 'storybook/test'

import { authClient } from '../../features/auth/lib/auth-client'
import preview from '../../storybook/preview'
import { Route } from './index'

const successSignInResult = {
  data: {
    redirect: false,
    token: 'test-token',
    url: undefined,
    user: {
      id: 'user-1',
      email: 'user@example.com',
      name: 'User',
      image: null,
      emailVerified: true,
      createdAt: new Date(0),
      updatedAt: new Date(0)
    }
  },
  error: null
} as const

const invalidCredentialsResult = {
  data: null,
  error: {
    code: 'INVALID_EMAIL_OR_PASSWORD',
    message: 'Invalid email or password',
    status: 401,
    statusText: 'Unauthorized'
  }
} as const

function neverSignIn() {
  return new Promise<never>(() => undefined)
}

const meta = preview.meta({
  title: 'Pages / サインイン画面',
  parameters: {
    layout: 'fullscreen',
    tanstack: {
      router: {
        route: Route
      }
    }
  },
  beforeEach: async () => {
    mocked(authClient.signIn.email).mockReset()
    mocked(authClient.signIn.email).mockResolvedValue(successSignInResult)
  }
})

export const Default = meta.story({
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('メール')).toBeInTheDocument()
    await expect(canvas.getByLabelText('パスワード')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'サインイン' })).toBeEnabled()
  }
})

export const InvalidCredentials = meta.story({
  beforeEach: async () => {
    mocked(authClient.signIn.email).mockResolvedValue(invalidCredentialsResult)
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByLabelText('メール'), 'user@example.com')
    await userEvent.type(canvas.getByLabelText('パスワード'), 'wrong-password')
    await userEvent.click(canvas.getByRole('button', { name: 'サインイン' }))
    await expect(canvas.getByRole('alert')).toHaveTextContent(
      'メールまたはパスワードが正しくありません'
    )
    await expect(canvas.getAllByText('メールまたはパスワードを確認してください')).toHaveLength(2)
  }
})

export const Pending = meta.story({
  beforeEach: async () => {
    mocked(authClient.signIn.email).mockImplementation(() => neverSignIn())
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByLabelText('メール'), 'user@example.com')
    await userEvent.type(canvas.getByLabelText('パスワード'), 'password123')
    await userEvent.click(canvas.getByRole('button', { name: 'サインイン' }))
    await expect(canvas.getByRole('button', { name: 'サインイン中...' })).toBeDisabled()
    await expect(canvas.getByRole('group', { name: 'ログイン' })).toBeDisabled()
  }
})
