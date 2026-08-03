import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { styled } from 'styled-system/jsx'
import * as v from 'valibot'

import { err, ok } from '../../../../../shared/domain/result'
import preview from '../../../../../storybook/preview'
import { tagIdSchema, tagNameSchema } from '../../../../tags/domain/tag-values'
import type { TagId } from '../../../../tags/domain/tag-values'
import { BookmarkTagField } from './index'
import type { CreateTag, SelectableTag } from './index'

function tag(id: number, name: string): SelectableTag {
  return {
    id: v.parse(tagIdSchema, id),
    name: v.parse(tagNameSchema, name)
  }
}

const sampleTags: readonly SelectableTag[] = [tag(1, 'react'), tag(2, 'typescript'), tag(3, 'uiux')]

const meta = preview.meta({
  title: 'Components / BookmarkTagField',
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
  render: () => <BookmarkTagField.Loading />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('タグを読み込み中…')).toBeInTheDocument()
    await expect(canvas.getByText('タグを読み込み中…')).toHaveAttribute('aria-busy', 'true')
  }
})

export const Empty = meta.story({
  render: () => (
    <BookmarkTagField.Blank onCreateTag={fn<CreateTag>(async () => ok(tag(10, 'new-tag')))} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByText('タグがまだありません。名前を入れて作成できます。')
    ).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'この名前で作成' })).toBeEnabled()
  }
})

export const Error = meta.story({
  render: () => (
    <BookmarkTagField.Error
      message='タグ候補の取得に失敗しました'
      onRetry={fn()}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toHaveTextContent('タグ候補の取得に失敗しました')
    await expect(canvas.getByRole('button', { name: /再試行/ })).toBeEnabled()
  }
})

function RetryDemo() {
  const [phase, setPhase] = useState<'error' | 'loading'>('error')
  if (phase === 'loading') {
    return <BookmarkTagField.Loading />
  }
  return (
    <BookmarkTagField.Error
      message='タグ候補の取得に失敗しました'
      onRetry={() => setPhase('loading')}
    />
  )
}

export const Retry = meta.story({
  render: () => <RetryDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /再試行/ }))
    await expect(canvas.getByText('タグを読み込み中…')).toBeInTheDocument()
  }
})

function ReadyDemo({ onCreateTag }: { readonly onCreateTag: CreateTag }) {
  const [selectedTagIds, setSelectedTagIds] = useState<readonly TagId[]>([sampleTags[0]!.id])
  const [tags, setTags] = useState<readonly SelectableTag[]>(sampleTags)

  return (
    <BookmarkTagField.Ready
      tags={tags}
      selectedTagIds={selectedTagIds}
      onSelectedTagIdsChange={setSelectedTagIds}
      onCreateTag={async (name) => {
        const result = await onCreateTag(name)
        if (result.ok) {
          setTags((current) =>
            current.some((item) => item.id === result.value.id)
              ? current
              : [...current, result.value]
          )
        }
        return result
      }}
    />
  )
}

export const Ready = meta.story({
  render: () => <ReadyDemo onCreateTag={fn<CreateTag>(async (name) => ok(tag(99, name)))} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('react')).toBeChecked()
    await expect(canvas.getByLabelText('typescript')).not.toBeChecked()
    await userEvent.click(canvas.getByLabelText('typescript'))
    await expect(canvas.getByLabelText('typescript')).toBeChecked()
  }
})

export const Create = meta.story({
  render: () => (
    <BookmarkTagField.Blank
      onCreateTag={fn<CreateTag>(async (name) => ok(tag(42, name)))}
      onCreated={fn()}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByPlaceholderText('タグを絞り込む / 新規作成')
    await userEvent.type(input, 'pantry')
    await userEvent.click(canvas.getByRole('button', { name: 'この名前で作成' }))
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument()
  }
})

export const CreateNameAlreadyExists = meta.story({
  render: () => (
    <BookmarkTagField.Blank
      onCreateTag={fn<CreateTag>(async () => err({ code: 'duplicate-tag-name', field: 'name' }))}
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

function ReadyServerErrorDemo({
  initialServerError,
  onCreateTag
}: {
  readonly initialServerError: string
  readonly onCreateTag: CreateTag
}) {
  const [selectedTagIds, setSelectedTagIds] = useState<readonly TagId[]>([sampleTags[0]!.id])
  const [serverError, setServerError] = useState<string | null>(initialServerError)

  return (
    <BookmarkTagField.Ready
      tags={sampleTags}
      selectedTagIds={selectedTagIds}
      onSelectedTagIdsChange={setSelectedTagIds}
      onCreateTag={onCreateTag}
      serverError={serverError}
      onClearServerError={() => setServerError(null)}
    />
  )
}

export const ReadyShowsServerErrorInTagArea = meta.story({
  render: () => (
    <ReadyServerErrorDemo
      initialServerError='選択したタグが見つかりません'
      onCreateTag={fn<CreateTag>(async (name) => ok(tag(99, name)))}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toHaveTextContent('選択したタグが見つかりません')
  }
})

export const SelectingTagClearsServerErrorInTagField = meta.story({
  render: () => (
    <ReadyServerErrorDemo
      initialServerError='選択したタグが見つかりません'
      onCreateTag={fn<CreateTag>(async (name) => ok(tag(99, name)))}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toHaveTextContent('選択したタグが見つかりません')
    await userEvent.click(canvas.getByLabelText('typescript'))
    await expect(canvas.queryByText('選択したタグが見つかりません')).not.toBeInTheDocument()
  }
})
