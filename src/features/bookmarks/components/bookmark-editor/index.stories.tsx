import { expect, fn, userEvent, within } from 'storybook/test'
import type { Mock } from 'storybook/test'
import { styled } from 'styled-system/jsx'
import { uuidv7 } from 'uuidv7'
import * as v from 'valibot'

import preview from '../../../../storybook/preview'
import { tagIdSchema } from '../../../tags/domain/tag-values'
import {
  bookmarkIdSchema,
  bookmarkNoteSchema,
  bookmarkTitleSchema,
  bookmarkUrlSchema
} from '../../domain/bookmark-values'
import { BookmarkEditor } from './index'
import type { BookmarkEditorData, BookmarkTitleFetchAction } from './index'

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
    onUpdateBookmark: fn(async () => ({ ok: true as const, bookmarkId })),
    onCompleted: fn(async () => undefined),
    fetchTitleAction: fn<BookmarkTitleFetchAction>(async () => ({
      status: 'success',
      title: '取得したタイトル'
    })),
    tagCandidates: [{ id: 1, name: 'React', pinned: true, sortOrder: 0 }],
    tagsReady: true,
    createTagAction: fn(async () => ({ status: 'idle' as const }))
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('URL')).toHaveValue(String(initialData.url))
    await expect(canvas.getByRole('button', { name: 'Reactを外す' })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: '更新' })).toBeEnabled()
  }
})

export const UpdateHasDuplicateUrl = Default.extend({
  args: {
    onUpdateBookmark: fn(async () => ({
      ok: false as const,
      failureCode: 'duplicate-url' as const
    }))
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '更新' }))
    await expect(canvas.getByRole('alert')).toHaveTextContent(
      '同じ URL のブックマークが既にあります'
    )
    await expect(canvas.getByRole('alert')).toHaveTextContent('この URL は既に登録されています')
  }
})

export const UpdateHasUnexpectedError = Default.extend({
  args: {
    onUpdateBookmark: fn(async () => ({ ok: false as const, failureCode: 'unexpected' as const }))
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '更新' }))
    await expect(canvas.getByRole('alert')).toHaveTextContent('保存に失敗しました')
  }
})

export const SessionExpiredShowsNoFormError = Default.extend({
  args: {
    onUpdateBookmark: fn(async () => ({ ok: false as const, failureCode: null }))
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '更新' }))
    // UNAUTHORIZED は interceptor の redirect に任せるため、フォームエラーは出さない。
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument()
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

export const EditingUrlClearsUrlServerError = Default.extend({
  args: {
    onUpdateBookmark: fn(async () => ({
      ok: false as const,
      failureCode: 'duplicate-url' as const
    }))
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '更新' }))
    await expect(canvas.getByText('この URL は既に登録されています')).toBeInTheDocument()

    await userEvent.type(canvas.getByLabelText('URL'), '-2')
    await expect(canvas.queryByText('この URL は既に登録されています')).not.toBeInTheDocument()
  }
})

export const InvalidTagKeepsDraftAndAsksToRepick = Default.extend({
  args: {
    onUpdateBookmark: fn(async () => ({
      ok: false as const,
      failureCode: 'invalid-tag' as const
    }))
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '更新' }))
    const alerts = canvas.getAllByRole('alert')
    await expect(alerts.length).toBeGreaterThanOrEqual(2)
    await expect(alerts[0]).toHaveTextContent('タグを選び直してください')
    await expect(canvas.getByRole('button', { name: 'Reactを外す' })).toBeInTheDocument()
    await expect(canvas.getByLabelText('URL')).toHaveValue(String(initialData.url))
    const command = (args.onUpdateBookmark as Mock).mock.calls[0]?.[0]
    await expect(command?.tagIds).toEqual([1])
  }
})
