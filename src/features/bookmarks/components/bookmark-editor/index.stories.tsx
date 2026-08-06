import { expect, fn, userEvent, within } from 'storybook/test'
import { styled } from 'styled-system/jsx'
import { uuidv7 } from 'uuidv7'
import * as v from 'valibot'

import { err, ok } from '../../../../shared/domain/result'
import preview from '../../../../storybook/preview'
import { tagIdSchema } from '../../../tags/domain/tag-values'
import type { ExecuteUpdateBookmark } from '../../application/execute-update-bookmark'
import type { BookmarkEditorData } from '../../application/load-bookmark-for-edit'
import {
  bookmarkIdSchema,
  bookmarkNoteSchema,
  bookmarkTitleSchema,
  bookmarkUrlSchema
} from '../../domain/bookmark-values'
import { BookmarkEditor } from './index'
import type { BookmarkTitleFetchAction } from './index'

const bookmarkId = v.parse(bookmarkIdSchema, uuidv7())

const initialData: BookmarkEditorData = {
  bookmarkId,
  url: v.parse(bookmarkUrlSchema, 'https://example.com/article'),
  title: v.parse(bookmarkTitleSchema, 'Example Article'),
  note: v.parse(bookmarkNoteSchema, 'メモ'),
  tagIds: [v.parse(tagIdSchema, 1)]
}

const meta = preview.meta({
  title: 'Components / BookmarkEditor',
  component: BookmarkEditor,
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

export const Default = meta.story({
  args: {
    initialData,
    onUpdateBookmark: fn<ExecuteUpdateBookmark>(async () => ok({ bookmarkId })),
    onCompleted: fn(async () => undefined),
    fetchTitleAction: fn<BookmarkTitleFetchAction>(async () => ({
      status: 'success',
      title: '取得したタイトル'
    }))
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('URL')).toHaveValue(String(initialData.url))
    await expect(canvas.getByRole('button', { name: '更新' })).toBeEnabled()
  }
})

export const UpdateHasDuplicateUrl = Default.extend({
  args: {
    onUpdateBookmark: fn<ExecuteUpdateBookmark>(async () => err({ code: 'duplicate-url' }))
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '更新' }))
    await expect(canvas.getByRole('alert')).toHaveTextContent(
      '同じ URL のブックマークが既にあります'
    )
  }
})

export const UpdateHasUnexpectedError = Default.extend({
  args: {
    onUpdateBookmark: fn<ExecuteUpdateBookmark>(async () => {
      throw new Error('boom')
    })
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '更新' }))
    await expect(canvas.getByRole('alert')).toHaveTextContent('保存に失敗しました')
  }
})

export const CompletionNavigationFails = Default.extend({
  args: {
    onCompleted: fn(async () => {
      throw new Error('navigation failed')
    })
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '更新' }))
    await expect(canvas.getByRole('alert')).toHaveTextContent(
      '保存は完了しましたが、画面の移動に失敗しました'
    )
    await expect(canvas.queryByText('navigation failed')).not.toBeInTheDocument()
  }
})

export const FetchingTitleClearsTitleServerError = Default.extend({
  args: {
    onUpdateBookmark: fn<ExecuteUpdateBookmark>(async () =>
      err({ code: 'invalid-title', field: 'title' })
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '更新' }))
    await expect(canvas.getByRole('alert')).toHaveTextContent('タイトルを入力してください')

    await userEvent.click(canvas.getByRole('button', { name: 'タイトルを取得' }))
    await expect(canvas.getByLabelText('タイトル')).toHaveValue('取得したタイトル')
    await expect(canvas.queryByText('タイトルを入力してください')).not.toBeInTheDocument()
  }
})
