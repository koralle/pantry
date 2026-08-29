import { expect, mocked, userEvent, waitFor, within } from 'storybook/test'

import { authClient } from '../../features/auth/lib/auth-client'
import {
  isConditionalMediationAvailable,
  isWebAuthnAvailable
} from '../../features/auth/lib/passkey.webauthn-support'
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

const cancelledPasskeyResult = {
  data: null,
  error: {
    code: 'AUTH_CANCELLED',
    message: 'Passkey authentication was cancelled',
    status: 400,
    statusText: 'Bad Request'
  }
} as const

const failedPasskeyResult = {
  data: null,
  error: {
    code: 'AUTHENTICATION_FAILED',
    message: 'Authentication failed',
    status: 400,
    statusText: 'Bad Request'
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
    mocked(authClient.signIn.passkey).mockReset()
    mocked(authClient.signIn.passkey).mockResolvedValue(cancelledPasskeyResult)
    mocked(isWebAuthnAvailable).mockReset()
    mocked(isWebAuthnAvailable).mockReturnValue(true)
    mocked(isConditionalMediationAvailable).mockReset()
    mocked(isConditionalMediationAvailable).mockResolvedValue(false)
  }
})

export const Default = meta.story({
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'ログイン', level: 1 })).toBeInTheDocument()
    await expect(canvas.getAllByRole('heading', { level: 1, hidden: true })).toHaveLength(1)
    const passkeyButton = await canvas.findByRole('button', { name: 'パスキーでログイン' })
    const email = canvas.getByLabelText('メール')
    expect(
      passkeyButton.compareDocumentPosition(email) & Node.DOCUMENT_POSITION_FOLLOWING
    ).not.toBe(0)
    await expect(canvas.getByText('または')).toBeInTheDocument()
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
    await waitFor(async () => {
      await expect(canvas.getByRole('alert')).toHaveTextContent(
        'メールまたはパスワードが正しくありません'
      )
    })
    await waitFor(() => {
      expect(canvas.getAllByText('メールまたはパスワードを確認してください')).toHaveLength(2)
    })
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
    await waitFor(async () => {
      await expect(canvas.getByRole('button', { name: 'サインイン中...' })).toBeDisabled()
    })
    await expect(canvas.getByRole('group', { name: 'サインイン' })).toBeDisabled()
  }
})

export const WebAuthnUnavailable = meta.story({
  beforeEach: async () => {
    mocked(isWebAuthnAvailable).mockReturnValue(false)
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => {
      expect(canvas.queryByRole('button', { name: 'パスキーでログイン' })).not.toBeInTheDocument()
    })
    await expect(canvas.queryByText('または')).not.toBeInTheDocument()
    await expect(canvas.getByLabelText('メール')).toBeEnabled()
    await expect(canvas.getByLabelText('パスワード')).toBeEnabled()
    await expect(canvas.getByRole('button', { name: 'サインイン' })).toBeEnabled()
  }
})

export const PasskeyCancelled = meta.story({
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: 'パスキーでログイン' }))
    await waitFor(async () => {
      await expect(canvas.getByRole('button', { name: 'パスキーでログイン' })).toBeEnabled()
    })
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument()
    await expect(canvas.getByLabelText('メール')).toBeEnabled()
    await expect(canvas.getByLabelText('パスワード')).toBeEnabled()
    await expect(canvas.getByRole('button', { name: 'サインイン' })).toBeEnabled()
  }
})

export const PasskeyFailed = meta.story({
  beforeEach: async () => {
    mocked(authClient.signIn.passkey).mockResolvedValue(failedPasskeyResult)
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: 'パスキーでログイン' }))
    await waitFor(async () => {
      await expect(canvas.getByRole('alert')).toHaveTextContent(
        'パスキー認証に失敗しました。もう一度試すか、メールとパスワードでログインしてください'
      )
    })
    await expect(canvas.getByRole('button', { name: 'パスキーでログイン' })).toBeEnabled()
    await expect(canvas.getByLabelText('メール')).toBeEnabled()
    await expect(canvas.getByRole('button', { name: 'サインイン' })).toBeEnabled()
  }
})

export const ConditionalUiDoesNotBlockPassword = meta.story({
  beforeEach: async () => {
    mocked(isConditionalMediationAvailable).mockResolvedValue(true)
    mocked(authClient.signIn.passkey).mockImplementation((opts?: { autoFill?: boolean }) => {
      if (opts?.autoFill === true) {
        return neverSignIn()
      }
      return Promise.resolve(cancelledPasskeyResult)
    })
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('button', { name: 'パスキーでログイン' })).toBeEnabled()
    await expect(canvas.getByLabelText('メール')).toBeEnabled()
    await expect(canvas.getByLabelText('パスワード')).toBeEnabled()
    await userEvent.type(canvas.getByLabelText('メール'), 'user@example.com')
    await userEvent.click(canvas.getByRole('button', { name: 'パスキーでログイン' }))
    await waitFor(async () => {
      await expect(canvas.getByRole('button', { name: 'パスキーでログイン' })).toBeEnabled()
    })
    await expect(canvas.getByLabelText('メール')).toHaveValue('user@example.com')
    await expect(canvas.getByRole('button', { name: 'サインイン' })).toBeEnabled()
  }
})
