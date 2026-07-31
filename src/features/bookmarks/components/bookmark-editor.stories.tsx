import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import type { Mock } from 'storybook/test'
import { styled } from 'styled-system/jsx'
import { uuidv7 } from 'uuidv7'
import * as v from 'valibot'

import { err, ok } from '../../../shared/domain/result'
import type { CreateTag } from '../../tags/application/create-tag'
import { tagIdSchema, tagNameSchema } from '../../tags/domain/tag-values'
import type { ExecuteUpdateBookmark } from '../application/execute-update-bookmark'
import type { BookmarkEditorData } from '../application/load-bookmark-for-edit'
import type { LoadSelectableTags, SelectableTagsResult } from '../application/load-selectable-tags'
import {
  bookmarkIdSchema,
  bookmarkNoteSchema,
  bookmarkTitleSchema,
  bookmarkUrlSchema
} from '../domain/bookmark-values'
import { BookmarkEditor } from './bookmark-editor'

const bookmarkId = v.parse(bookmarkIdSchema, uuidv7())

const initialData: BookmarkEditorData = {
  bookmarkId,
  url: v.parse(bookmarkUrlSchema, 'https://example.com/article'),
  title: v.parse(bookmarkTitleSchema, 'Example Article'),
  note: v.parse(bookmarkNoteSchema, 'メモ'),
  tagIds: [v.parse(tagIdSchema, 1)]
}

const sampleTags = [
  { id: v.parse(tagIdSchema, 1), name: v.parse(tagNameSchema, 'react') },
  { id: v.parse(tagIdSchema, 2), name: v.parse(tagNameSchema, 'typescript') }
] as const

function resolvedTags(result: SelectableTagsResult): Promise<SelectableTagsResult> {
  return Promise.resolve(result)
}

function deferredTags(): {
  promise: Promise<SelectableTagsResult>
  resolve: (result: SelectableTagsResult) => void
} {
  let resolve!: (result: SelectableTagsResult) => void
  const promise = new Promise<SelectableTagsResult>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

const meta = {
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
} satisfies Meta<typeof BookmarkEditor>

export default meta

type Story = StoryObj<typeof meta>

const baseArgs = {
  initialData,
  onUpdateBookmark: fn<ExecuteUpdateBookmark>(async () => ok({ bookmarkId })),
  initialTags: resolvedTags(ok(sampleTags)),
  onLoadSelectableTags: fn<LoadSelectableTags>(async () => ok(sampleTags)),
  onCreateTag: fn<CreateTag>(async (name) =>
    ok({ id: v.parse(tagIdSchema, 99), name: v.parse(tagNameSchema, name) })
  ),
  onCompleted: fn(async () => undefined),
  onFetchTitle: fn(async () => '取得したタイトル')
}

export const Default = {
  args: baseArgs,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('URL')).toHaveValue(String(initialData.url))
    await expect(canvas.getByRole('checkbox', { name: 'react' })).toBeChecked()
    await expect(canvas.getByRole('button', { name: '更新' })).toBeEnabled()
  }
} as const satisfies Story

export const TagOptionsAreLoading = {
  args: {
    ...baseArgs,
    initialTags: deferredTags().promise
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('URL')).toBeEnabled()
    await expect(canvas.getByText('タグを読み込み中…')).toBeInTheDocument()
  }
} as const satisfies Story

export const TagOptionsLoadFailed = {
  args: {
    ...baseArgs,
    initialTags: resolvedTags(err({ code: 'unexpected-error' })),
    onLoadSelectableTags: fn<LoadSelectableTags>(async () => ok(sampleTags))
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('タグ候補の取得に失敗しました')).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: /再試行/ }))
    const onLoadSelectableTags = args.onLoadSelectableTags as Mock<LoadSelectableTags>
    await expect(onLoadSelectableTags).toHaveBeenCalled()
    await waitFor(async () => {
      await expect(canvas.getByRole('checkbox', { name: 'react' })).toBeInTheDocument()
    })
  }
} as const satisfies Story

export const UpdateHasDuplicateUrl = {
  args: {
    ...baseArgs,
    onUpdateBookmark: fn<ExecuteUpdateBookmark>(async () => err({ code: 'duplicate-url' }))
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '更新' }))
    await expect(canvas.getByRole('alert')).toHaveTextContent(
      '同じ URL のブックマークが既にあります'
    )
  }
} as const satisfies Story

export const UpdateHasUnexpectedError = {
  args: {
    ...baseArgs,
    onUpdateBookmark: fn<ExecuteUpdateBookmark>(async () => {
      throw new Error('boom')
    })
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '更新' }))
    await expect(canvas.getByRole('alert')).toHaveTextContent('保存に失敗しました')
  }
} as const satisfies Story
