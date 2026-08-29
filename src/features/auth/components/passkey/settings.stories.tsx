import { expect, mocked, userEvent, waitFor, within } from 'storybook/test'
import { styled } from 'styled-system/jsx'

import preview from '../../../../storybook/preview'
import { authClient } from '../../lib/auth-client'
import { isWebAuthnAvailable } from '../../lib/passkey.webauthn-support'
import type { ManagedPasskey } from './list-item'
import { PasskeySettings } from './settings'

const googleAaguid = 'ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4'
const unknownAaguid = '00000000-0000-0000-0000-000000000000'
const createdAt = new Date('2026-08-28T03:00:00.000Z')

function passkey(overrides: Partial<ManagedPasskey> & { readonly id: string }): ManagedPasskey {
  return {
    name: null,
    aaguid: unknownAaguid,
    createdAt,
    ...overrides
  }
}

const emptyListResult = { data: [] as ManagedPasskey[], error: null }
const successMutation = { data: { status: true }, error: null }

function neverResolve() {
  return new Promise<never>(() => undefined)
}

const meta = preview.meta({
  title: 'Components / PasskeySettings',
  component: PasskeySettings,
  parameters: {
    layout: 'padded'
  },
  decorators: [
    (Story) => (
      <styled.div maxInlineSize='28rem'>
        <Story />
      </styled.div>
    )
  ],
  beforeEach: async () => {
    mocked(isWebAuthnAvailable).mockReset()
    mocked(isWebAuthnAvailable).mockReturnValue(true)
    mocked(authClient.passkey.listUserPasskeys).mockReset()
    mocked(authClient.passkey.listUserPasskeys).mockResolvedValue(emptyListResult)
    mocked(authClient.passkey.addPasskey).mockReset()
    mocked(authClient.passkey.addPasskey).mockResolvedValue({
      data: null,
      error: {
        code: 'REGISTRATION_CANCELLED',
        message: 'cancelled',
        status: 400,
        statusText: 'Bad Request'
      }
    })
    mocked(authClient.passkey.updatePasskey).mockReset()
    mocked(authClient.passkey.updatePasskey).mockResolvedValue({
      data: { passkey: passkey({ id: 'pk-1', name: '自宅' }) },
      error: null
    })
    mocked(authClient.passkey.deletePasskey).mockReset()
    mocked(authClient.passkey.deletePasskey).mockResolvedValue(successMutation)
  }
})

function page(canvasElement: HTMLElement) {
  return within(canvasElement.ownerDocument.body)
}

export const EmptyList = meta.story({
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'パスキー' })).toBeInTheDocument()
    await expect(await canvas.findByText('パスキーはまだ登録されていません')).toBeInTheDocument()
    await expect(await canvas.findByRole('button', { name: 'パスキーを追加' })).toBeEnabled()
    await expect(canvas.queryByLabelText('表示名')).not.toBeInTheDocument()
  }
})

export const NamedAndFallbackNames = meta.story({
  beforeEach: async () => {
    mocked(authClient.passkey.listUserPasskeys).mockResolvedValue({
      data: [
        passkey({ id: 'pk-named', name: '仕事用キー', aaguid: googleAaguid }),
        passkey({ id: 'pk-google', name: null, aaguid: googleAaguid }),
        passkey({ id: 'pk-unknown', name: null, aaguid: unknownAaguid })
      ],
      error: null
    })
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('article', { name: '仕事用キー' })).toBeInTheDocument()
    await expect(
      canvas.getByRole('article', { name: 'Google Password Manager' })
    ).toBeInTheDocument()
    await expect(canvas.getByRole('article', { name: 'パスキー' })).toBeInTheDocument()
    expect(canvas.getAllByText('登録日時 2026/08/28 12:00')).toHaveLength(3)
  }
})

export const AddWithoutPrefillingName = meta.story({
  beforeEach: async () => {
    mocked(authClient.passkey.addPasskey).mockImplementation(() => neverResolve())
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: 'パスキーを追加' }))
    await waitFor(async () => {
      await expect(canvas.getByRole('button', { name: 'パスキーを登録中...' })).toBeDisabled()
    })
    await expect(canvas.queryByLabelText('表示名')).not.toBeInTheDocument()
    expect(mocked(authClient.passkey.addPasskey).mock.calls[0]?.length ?? 0).toBe(0)
  }
})

export const CancelAddLeavesListUnchanged = meta.story({
  beforeEach: async () => {
    mocked(authClient.passkey.addPasskey).mockResolvedValue({
      data: null,
      error: {
        code: 'REGISTRATION_CANCELLED',
        message: 'cancelled',
        status: 400,
        statusText: 'Bad Request'
      }
    })
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: 'パスキーを追加' }))
    await waitFor(async () => {
      await expect(canvas.getByRole('button', { name: 'パスキーを追加' })).toBeEnabled()
    })
    await expect(canvas.getByText('パスキーはまだ登録されていません')).toBeInTheDocument()
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument()
  }
})

export const TwoPasskeys = meta.story({
  beforeEach: async () => {
    mocked(authClient.passkey.listUserPasskeys).mockResolvedValue({
      data: [passkey({ id: 'pk-1', name: '自宅' }), passkey({ id: 'pk-2', name: '仕事用キー' })],
      error: null
    })
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('article', { name: '自宅' })).toBeInTheDocument()
    await expect(canvas.getByRole('article', { name: '仕事用キー' })).toBeInTheDocument()
    expect(canvas.getAllByRole('button', { name: '名前を変更' })).toHaveLength(2)
    expect(canvas.getAllByRole('button', { name: '削除' })).toHaveLength(2)
  }
})

export const RenameUpdatesList = meta.story({
  beforeEach: async () => {
    let items = [passkey({ id: 'pk-1', name: '仕事用キー' })]
    mocked(authClient.passkey.listUserPasskeys).mockImplementation(async () => ({
      data: items,
      error: null
    }))
    mocked(authClient.passkey.updatePasskey).mockImplementation(async (input: { name: string }) => {
      items = [passkey({ id: 'pk-1', name: input.name })]
      return { data: { passkey: items[0] }, error: null }
    })
  },
  play: async ({ canvasElement }) => {
    const canvas = page(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: '名前を変更' }))
    const name = await canvas.findByLabelText('表示名')
    await userEvent.clear(name)
    await userEvent.type(name, '自宅')
    await userEvent.click(canvas.getByRole('button', { name: '保存' }))
    await waitFor(async () => {
      await expect(canvas.getByRole('article', { name: '自宅' })).toBeInTheDocument()
    })
    await expect(canvas.getByRole('status')).toHaveTextContent('表示名を変更しました')
    await expect(canvas.queryByRole('article', { name: '仕事用キー' })).not.toBeInTheDocument()
  }
})

export const DeleteShowsConfirmation = meta.story({
  beforeEach: async () => {
    mocked(authClient.passkey.listUserPasskeys).mockResolvedValue({
      data: [passkey({ id: 'pk-1', name: '自宅' })],
      error: null
    })
  },
  play: async ({ canvasElement }) => {
    const canvas = page(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: '削除' }))
    await expect(
      await canvas.findByRole('heading', { name: 'このパスキーを削除しますか？' })
    ).toBeInTheDocument()
    await expect(canvas.getByText(/「自宅」を削除します/)).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: '削除を確認' })).toBeEnabled()
    expect(mocked(authClient.passkey.deletePasskey)).not.toHaveBeenCalled()
  }
})

export const CancelDeleteKeepsPasskey = meta.story({
  beforeEach: async () => {
    mocked(authClient.passkey.listUserPasskeys).mockResolvedValue({
      data: [passkey({ id: 'pk-1', name: '自宅' })],
      error: null
    })
  },
  play: async ({ canvasElement }) => {
    const canvas = page(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: '削除' }))
    await userEvent.click(await canvas.findByRole('button', { name: 'キャンセル' }))
    await waitFor(() => {
      expect(
        canvas.queryByRole('heading', { name: 'このパスキーを削除しますか？' })
      ).not.toBeInTheDocument()
    })
    await expect(canvas.getByRole('article', { name: '自宅' })).toBeInTheDocument()
    expect(mocked(authClient.passkey.deletePasskey)).not.toHaveBeenCalled()
  }
})

export const DeleteRemovesPasskey = meta.story({
  beforeEach: async () => {
    let items = [passkey({ id: 'pk-1', name: '自宅' }), passkey({ id: 'pk-2', name: '仕事用キー' })]
    mocked(authClient.passkey.listUserPasskeys).mockImplementation(async () => ({
      data: items,
      error: null
    }))
    mocked(authClient.passkey.deletePasskey).mockImplementation(async () => {
      items = items.filter((item) => item.id !== 'pk-1')
      return successMutation
    })
  },
  play: async ({ canvasElement }) => {
    const canvas = page(canvasElement)
    const deleteButtons = await canvas.findAllByRole('button', { name: '削除' })
    await userEvent.click(deleteButtons[0]!)
    await userEvent.click(await canvas.findByRole('button', { name: '削除を確認' }))
    await waitFor(async () => {
      await expect(canvas.queryByRole('article', { name: '自宅' })).not.toBeInTheDocument()
    })
    await expect(canvas.getByRole('article', { name: '仕事用キー' })).toBeInTheDocument()
    await expect(canvas.getByRole('status')).toHaveTextContent('パスキーを削除しました')
  }
})

export const LastPasskeyCanBeDeleted = meta.story({
  beforeEach: async () => {
    let items = [passkey({ id: 'pk-last', name: '最後のキー' })]
    mocked(authClient.passkey.listUserPasskeys).mockImplementation(async () => ({
      data: items,
      error: null
    }))
    mocked(authClient.passkey.deletePasskey).mockImplementation(async () => {
      items = []
      return successMutation
    })
  },
  play: async ({ canvasElement }) => {
    const canvas = page(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: '削除' }))
    await userEvent.click(await canvas.findByRole('button', { name: '削除を確認' }))
    await waitFor(async () => {
      await expect(canvas.getByText('パスキーはまだ登録されていません')).toBeInTheDocument()
    })
    await expect(canvas.getByRole('status')).toHaveTextContent('パスキーを削除しました')
    await expect(canvas.getByRole('button', { name: 'パスキーを追加' })).toBeEnabled()
  }
})

export const HideAddWhenWebAuthnUnavailable = meta.story({
  beforeEach: async () => {
    mocked(isWebAuthnAvailable).mockReturnValue(false)
    mocked(authClient.passkey.listUserPasskeys).mockResolvedValue({
      data: [passkey({ id: 'pk-1', name: '自宅' })],
      error: null
    })
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('article', { name: '自宅' })).toBeInTheDocument()
    await waitFor(() => {
      expect(canvas.queryByRole('button', { name: 'パスキーを追加' })).not.toBeInTheDocument()
    })
  }
})

export const ListLoadError = meta.story({
  beforeEach: async () => {
    mocked(authClient.passkey.listUserPasskeys).mockResolvedValue({
      data: null,
      error: {
        code: 'FAILED_TO_LIST',
        message: 'failed',
        status: 500,
        statusText: 'Error'
      }
    })
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('alert')).toHaveTextContent('パスキーの操作に失敗しました')
    await expect(canvas.queryByText('パスキーはまだ登録されていません')).not.toBeInTheDocument()
  }
})

export const AddFailed = meta.story({
  beforeEach: async () => {
    mocked(authClient.passkey.addPasskey).mockResolvedValue({
      data: null,
      error: {
        code: 'FAILED_TO_VERIFY_REGISTRATION',
        message: 'failed',
        status: 400,
        statusText: 'Bad Request'
      }
    })
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: 'パスキーを追加' }))
    await waitFor(async () => {
      await expect(canvas.getByRole('alert')).toHaveTextContent('パスキーの登録に失敗しました')
    })
    await expect(canvas.getByText('パスキーはまだ登録されていません')).toBeInTheDocument()
  }
})

export const RenameFailed = meta.story({
  beforeEach: async () => {
    mocked(authClient.passkey.listUserPasskeys).mockResolvedValue({
      data: [passkey({ id: 'pk-1', name: '仕事用キー' })],
      error: null
    })
    mocked(authClient.passkey.updatePasskey).mockResolvedValue({
      data: null,
      error: {
        code: 'FAILED_TO_UPDATE_PASSKEY',
        message: 'failed',
        status: 500,
        statusText: 'Error'
      }
    })
  },
  play: async ({ canvasElement }) => {
    const canvas = page(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: '名前を変更' }))
    const name = await canvas.findByLabelText('表示名')
    await userEvent.clear(name)
    await userEvent.type(name, '自宅')
    await userEvent.click(canvas.getByRole('button', { name: '保存' }))
    await waitFor(async () => {
      await expect(canvas.getByRole('alert')).toHaveTextContent('パスキーの操作に失敗しました')
    })
    await expect(canvas.getByRole('article', { name: '仕事用キー' })).toBeInTheDocument()
    await expect(canvas.getByRole('dialog')).toBeInTheDocument()
  }
})

export const DeleteFailed = meta.story({
  beforeEach: async () => {
    mocked(authClient.passkey.listUserPasskeys).mockResolvedValue({
      data: [passkey({ id: 'pk-1', name: '自宅' })],
      error: null
    })
    mocked(authClient.passkey.deletePasskey).mockResolvedValue({
      data: null,
      error: {
        code: 'FAILED_TO_DELETE',
        message: 'failed',
        status: 500,
        statusText: 'Error'
      }
    })
  },
  play: async ({ canvasElement }) => {
    const canvas = page(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: '削除' }))
    await userEvent.click(await canvas.findByRole('button', { name: '削除を確認' }))
    await waitFor(async () => {
      await expect(canvas.getByRole('alert')).toHaveTextContent('パスキーの操作に失敗しました')
    })
    await expect(canvas.getByRole('article', { name: '自宅' })).toBeInTheDocument()
    await expect(
      canvas.getByRole('heading', { name: 'このパスキーを削除しますか？' })
    ).toBeInTheDocument()
  }
})
