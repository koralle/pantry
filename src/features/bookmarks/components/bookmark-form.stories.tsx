import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import type { Mock } from 'storybook/test'
import { styled } from 'styled-system/jsx'

import preview from '../../../storybook/preview'
import { BookmarkForm } from './bookmark-form'
import type { BookmarkFormProps, BookmarkFormSubmitValues } from './bookmark-form'

const meta = preview.meta({
  title: 'Components / BookmarkForm',
  component: BookmarkForm,
  parameters: {
    layout: 'padded'
  },
  decorators: [
    (Story) => (
      <styled.div maxInlineSize='36rem'>
        <Story />
      </styled.div>
    )
  ]
})

const defaultInitialValues = {
  url: 'https://example.com/article',
  title: 'Example Article',
  note: 'メモの下書き'
} as const

export const Default = meta.story({
  args: {
    initialValues: defaultInitialValues,
    submitLabel: '更新',
    pendingLabel: '更新中…',
    onSubmit: fn<(...args: Parameters<BookmarkFormProps['onSubmit']>) => void>(),
    onFetchTitle: fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      return '取得したタイトル'
    })
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('URL')).toHaveValue(defaultInitialValues.url)
    await expect(canvas.getByLabelText('タイトル')).toHaveValue(defaultInitialValues.title)
    await expect(canvas.getByRole('button', { name: '更新' })).toBeEnabled()
  }
})

export const RejectsEmptyUrl = Default.extend({
  args: {
    initialValues: {
      url: '',
      title: '手入力タイトル',
      note: null
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'タイトルを取得' }))
    await expect(canvas.getByRole('alert')).toHaveTextContent('先にURLを入力してください')
    await expect(canvas.getByLabelText('タイトル')).toHaveValue('手入力タイトル')
  }
})

export const RetryClearsTitleFetchError = Default.extend({
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const fetchButton = canvas.getByRole('button', { name: 'タイトルを取得' })
    const onFetchTitle = args.onFetchTitle as Mock<(url: string) => Promise<string | null>>
    onFetchTitle.mockImplementationOnce(async () => null)
    onFetchTitle.mockImplementationOnce(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      return '再び取得したタイトル'
    })

    await userEvent.click(fetchButton)
    await expect(canvas.getByRole('alert')).toHaveTextContent(
      'タイトルを取得できませんでした。手入力で続けられます'
    )

    await userEvent.click(fetchButton)
    await waitFor(
      () => {
        expect(canvas.getByLabelText('タイトル')).toHaveValue('再び取得したタイトル')
      },
      { timeout: 3000 }
    )
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument()
  }
})

export const TitleFetchPending = Default.extend({
  args: {
    onFetchTitle: fn(async (_url: string): Promise<string | null> => {
      await new Promise<string | null>(() => {})
      return null
    })
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'タイトルを取得' }))
    await expect(canvas.getByRole('button', { name: '取得中…' })).toBeDisabled()
    await expect(canvas.getByLabelText('URL')).toBeDisabled()
  }
})

export const FieldError = Default.extend({
  args: {
    initialValues: {
      url: 'not-a-url',
      title: '   ',
      note: null
    },
    onSubmit: fn<(...args: Parameters<BookmarkFormProps['onSubmit']>) => void>()
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '更新' }))
    await expect(canvas.getByRole('alert')).toHaveTextContent('入力内容を確認してください')
    await expect(canvas.getByText('Invalid URL: Received "not-a-url"')).toBeInTheDocument()
    await expect(canvas.getByText('タイトルを入力してください')).toBeInTheDocument()
    await expect(args.onSubmit).not.toHaveBeenCalled()
  }
})

export const SummaryError = Default.extend({
  args: {
    errors: {
      summary: '同じURLのブックマークが既に存在します',
      fields: {
        url: '別のURLを指定してください'
      }
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toHaveTextContent(
      '同じURLのブックマークが既に存在します'
    )
    await expect(canvas.getByText('別のURLを指定してください')).toBeInTheDocument()
  }
})

export const Pending = Default.extend({
  args: {
    onSubmit: fn(async () => {
      await new Promise<void>(() => {})
    })
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '更新' }))
    await expect(canvas.getByRole('button', { name: '更新中…' })).toBeDisabled()
    await expect(canvas.getByLabelText('URL')).toBeDisabled()
  }
})

export const SubmitsBrandedValues = Default.extend({
  args: {
    onSubmit: fn<(values: BookmarkFormSubmitValues) => void>()
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const onSubmit = args.onSubmit as Mock<(values: BookmarkFormSubmitValues) => void>
    await userEvent.click(canvas.getByRole('button', { name: '更新' }))
    await expect(onSubmit).toHaveBeenCalledTimes(1)
    const values = onSubmit.mock.calls[0]?.[0]
    await expect(values?.url).toBe(defaultInitialValues.url)
    await expect(values?.title).toBe(defaultInitialValues.title)
    await expect(values?.note).toBe(defaultInitialValues.note)
  }
})
