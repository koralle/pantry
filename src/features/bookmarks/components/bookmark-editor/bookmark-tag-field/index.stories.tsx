import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { styled } from 'styled-system/jsx'
import * as v from 'valibot'

import { err, ok } from '../../../../../shared/domain/result'
import preview from '../../../../../storybook/preview'
import { tagIdSchema, tagNameSchema } from '../../../../tags/domain/tag-values'
import type { TagId } from '../../../../tags/domain/tag-values'
import type { SelectableTagsResult } from '../../../application/load-selectable-tags'
import { BookmarkTagField } from './index'
import type { CreateTag, SelectableTag } from './index'

function tag(id: number, name: string): SelectableTag {
  return {
    id: v.parse(tagIdSchema, id),
    name: v.parse(tagNameSchema, name)
  }
}

const sampleTags: readonly SelectableTag[] = [tag(1, 'react'), tag(2, 'typescript'), tag(3, 'uiux')]

const defaultCreateTag: CreateTag = async (name) => ok(tag(99, name))

function resolvedTags(result: SelectableTagsResult): Promise<SelectableTagsResult> {
  return Promise.resolve(result)
}

function deferredTags(): {
  promise: Promise<SelectableTagsResult>
  resolve: (result: SelectableTagsResult) => void
  reject: (reason?: unknown) => void
} {
  let resolve!: (result: SelectableTagsResult) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<SelectableTagsResult>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

type TagFieldStoryProps = {
  readonly initialTags: Promise<SelectableTagsResult>
  readonly onCreateTag?: CreateTag | undefined
  readonly initialServerError?: string
}

function TagFieldStory({
  initialTags,
  onCreateTag = defaultCreateTag,
  initialServerError
}: TagFieldStoryProps) {
  const [selectedTagIds, setSelectedTagIds] = useState<readonly TagId[]>([sampleTags[0]!.id])
  const [serverError, setServerError] = useState<string | null>(initialServerError ?? null)

  return (
    <BookmarkTagField
      initialTags={initialTags}
      selectedTagIds={selectedTagIds}
      onSelectedTagIdsChange={setSelectedTagIds}
      onCreateTag={onCreateTag}
      serverError={serverError}
      onClearServerError={() => setServerError(null)}
    />
  )
}

const loadingTags = deferredTags()
const meta = preview.meta({
  title: 'Components / BookmarkTagField',
  component: BookmarkTagField,
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

export const Loading = meta.story({
  render: () => <TagFieldStory initialTags={loadingTags.promise} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('タグを読み込み中…')).toBeInTheDocument()
    await expect(canvas.getByText('タグを読み込み中…')).toHaveAttribute('aria-busy', 'true')
  }
})

export const Empty = meta.story({
  render: () => <TagFieldStory initialTags={resolvedTags(ok([]))} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByText('タグがまだありません。名前を入れて作成できます。')
    ).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'この名前で作成' })).toBeEnabled()
  }
})

export const Error = meta.story({
  render: () => <TagFieldStory initialTags={resolvedTags(err({ code: 'unexpected-error' }))} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toHaveTextContent('タグ候補の取得に失敗しました')
  }
})

export const Create = meta.story({
  render: () => <TagFieldStory initialTags={resolvedTags(ok([]))} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByPlaceholderText('タグを絞り込む / 新規作成')
    await userEvent.type(input, 'pantry')
    await userEvent.click(canvas.getByRole('button', { name: 'この名前で作成' }))
    await expect(canvas.findByRole('checkbox', { name: 'pantry' })).resolves.toBeChecked()
  }
})

export const CreateFromReady = meta.story({
  render: () => <TagFieldStory initialTags={resolvedTags(ok(sampleTags))} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByPlaceholderText('タグを絞り込む / 新規作成')
    await userEvent.type(input, 'pantry')
    await userEvent.click(canvas.getByRole('button', { name: 'この名前で作成' }))
    await expect(canvas.findByRole('checkbox', { name: 'pantry' })).resolves.toBeChecked()
  }
})

export const CreateNameAlreadyExists = meta.story({
  render: () => (
    <TagFieldStory
      initialTags={resolvedTags(ok(sampleTags))}
      onCreateTag={async () => err({ code: 'duplicate-tag-name', field: 'name' })}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByPlaceholderText('タグを絞り込む / 新規作成')
    await userEvent.type(input, 'react')
    await userEvent.click(canvas.getByRole('button', { name: 'この名前で作成' }))
    await expect(canvas.getByRole('alert')).toHaveTextContent('そのタグ名は既に存在します')
  }
})

export const Ready = meta.story({
  render: () => <TagFieldStory initialTags={resolvedTags(ok(sampleTags))} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('react')).toBeChecked()
    await expect(canvas.getByLabelText('typescript')).not.toBeChecked()
    await userEvent.click(canvas.getByLabelText('typescript'))
    await expect(canvas.getByLabelText('typescript')).toBeChecked()
  }
})

export const ReadyShowsServerErrorInTagArea = meta.story({
  render: () => (
    <TagFieldStory
      initialTags={resolvedTags(ok(sampleTags))}
      initialServerError='選択したタグが見つかりません'
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toHaveTextContent('選択したタグが見つかりません')
  }
})

export const SelectingTagClearsServerErrorInTagField = meta.story({
  render: () => (
    <TagFieldStory
      initialTags={resolvedTags(ok(sampleTags))}
      initialServerError='選択したタグが見つかりません'
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByLabelText('typescript'))
    await expect(canvas.queryByText('選択したタグが見つかりません')).not.toBeInTheDocument()
  }
})
