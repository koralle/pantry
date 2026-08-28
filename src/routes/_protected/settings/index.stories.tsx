import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, mocked, waitFor, within } from 'storybook/test'

import { authClient } from '../../../features/auth/lib/auth-client'
import { isWebAuthnAvailable } from '../../../features/auth/lib/webauthn-support'
import preview from '../../../storybook/preview'
import { Route } from './index'

const storyQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false
    }
  }
})

const storyUser = {
  id: 'user-1',
  name: 'koralle',
  email: 'koralle@example.com'
}

const meta = preview.meta({
  title: 'Pages / 設定画面',
  parameters: {
    layout: 'fullscreen',
    tanstack: {
      router: {
        route: Route,
        routeOverrides: {
          '/_protected': {
            beforeLoad: async () => ({
              user: storyUser
            }),
            loader: async () => ({
              shelfTagsPromise: Promise.resolve([])
            })
          },
          '/_protected/settings/': {
            loader: async () => ({
              user: storyUser
            })
          }
        }
      }
    }
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={storyQueryClient}>
        <Story />
      </QueryClientProvider>
    )
  ],
  beforeEach: async () => {
    mocked(isWebAuthnAvailable).mockReset()
    mocked(isWebAuthnAvailable).mockReturnValue(true)
    mocked(authClient.passkey.listUserPasskeys).mockReset()
    mocked(authClient.passkey.listUserPasskeys).mockResolvedValue({ data: [], error: null })
    mocked(authClient.signOut).mockReset()
    await storyQueryClient.clear()
  }
})

export const Default = meta.story({
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: '設定', level: 1 })).toBeInTheDocument()
    await expect(canvas.getByText('アカウント、パスキー、ログアウト')).toBeInTheDocument()
    const account = canvas.getByRole('heading', { name: 'アカウント' })
    const passkeys = canvas.getByRole('heading', { name: 'パスキー' })
    const session = canvas.getByRole('heading', { name: 'セッション' })
    expect(account.compareDocumentPosition(passkeys) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0)
    expect(passkeys.compareDocumentPosition(session) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0)
    await expect(canvas.getByText('koralle')).toBeInTheDocument()
    await expect(await canvas.findByText('パスキーはまだ登録されていません')).toBeInTheDocument()
    await expect(await canvas.findByRole('button', { name: 'パスキーを追加' })).toBeEnabled()
    await expect(canvas.getByRole('button', { name: 'ログアウト' })).toBeEnabled()
  }
})

export const WebAuthnUnavailable = meta.story({
  beforeEach: async () => {
    mocked(isWebAuthnAvailable).mockReturnValue(false)
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => {
      expect(canvas.queryByRole('button', { name: 'パスキーを追加' })).not.toBeInTheDocument()
    })
    await expect(canvas.getByRole('button', { name: 'ログアウト' })).toBeEnabled()
    await expect(canvas.getByText('パスキーはまだ登録されていません')).toBeInTheDocument()
  }
})
