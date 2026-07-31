import { expect, fn, userEvent, within } from 'storybook/test'
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
    submission: 'idle' as const,
    submitLabel: '更新',
    pendingLabel: '更新中…',
    onSubmit: fn<(...args: Parameters<BookmarkFormProps['onSubmit']>) => void>(),
    onFetchTitle: fn(async () => '取得したタイトル')
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('URL')).toHaveValue(defaultInitialValues.url)
    await expect(canvas.getByLabelText('タイトル')).toHaveValue(defaultInitialValues.title)
    await expect(canvas.getByRole('button', { name: '更新' })).toBeEnabled()
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
    submission: 'pending'
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
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
