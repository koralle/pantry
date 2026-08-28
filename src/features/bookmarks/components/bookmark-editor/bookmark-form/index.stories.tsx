import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import type { Mock } from 'storybook/test'
import { styled } from 'styled-system/jsx'

import preview from '../../../../../storybook/preview'
import type { CreateTagFromPickerAction } from '../../../lib/execute-create-tag-from-picker'
import type { TagCandidate } from '../../bookmark-tag-picker'
import { BookmarkForm } from './index'
import type {
  BookmarkFormFieldKey,
  BookmarkFormProps,
  BookmarkFormServerError,
  BookmarkFormSubmitValues,
  BookmarkTitleFetchAction
} from './index'

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
  note: 'メモの下書き',
  tagIds: [] as number[]
} as const

const defaultTagCandidates: TagCandidate[] = [
  { id: 1, name: 'React', pinned: true, sortOrder: 0 },
  { id: 2, name: 'TypeScript', pinned: false, sortOrder: 0 },
  { id: 3, name: 'Cloudflare', pinned: false, sortOrder: 1 }
]

const idleCreateTagAction = fn<CreateTagFromPickerAction>(async () => ({ status: 'idle' }))

// タイトル取得を主目的としない story が共通で使う action。
const defaultFetchTitleAction = fn<BookmarkTitleFetchAction>(async () => ({
  status: 'success',
  title: '取得したタイトル'
}))

export const Default = meta.story({
  args: {
    initialValues: defaultInitialValues,
    submitLabel: '更新',
    pendingLabel: '更新中…',
    onSubmit: fn<(...args: Parameters<BookmarkFormProps['onSubmit']>) => void>(),
    tagCandidates: defaultTagCandidates,
    tagsReady: true,
    createTagAction: idleCreateTagAction,
    fetchTitleAction: fn<BookmarkTitleFetchAction>(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      return { status: 'success', title: '取得したタイトル' }
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
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const fetchTitleAction = args.fetchTitleAction as Mock<BookmarkTitleFetchAction>
    await userEvent.click(canvas.getByRole('button', { name: 'タイトルを取得' }))
    await expect(canvas.getByRole('alert')).toHaveTextContent('先にURLを入力してください')
    await expect(canvas.getByLabelText('タイトル')).toHaveValue('手入力タイトル')
    // 空 URL は dispatch 前に弾かれるため、Server (action) は呼ばれない
    await expect(fetchTitleAction).not.toHaveBeenCalled()
  }
})

export const RetryClearsTitleFetchError = Default.extend({
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const fetchButton = canvas.getByRole('button', { name: 'タイトルを取得' })
    const fetchTitleAction = args.fetchTitleAction as Mock<BookmarkTitleFetchAction>
    fetchTitleAction.mockImplementationOnce(async () => ({
      status: 'error',
      message: 'タイトルを取得できませんでした。手入力で続けられます'
    }))
    fetchTitleAction.mockImplementationOnce(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      return { status: 'success', title: '再び取得したタイトル' }
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
    fetchTitleAction: fn<BookmarkTitleFetchAction>(async () => {
      await new Promise(() => {})
      return { status: 'idle' }
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
    await expect(canvas.getByText('有効なURLを入力してください')).toBeInTheDocument()
    await expect(canvas.getByText('タイトルを入力してください')).toBeInTheDocument()
    await expect(args.onSubmit).not.toHaveBeenCalled()
  }
})

export const SummaryError = Default.extend({
  args: {
    serverError: {
      summary: '同じURLのブックマークが既に存在します',
      fields: {
        url: '別のURLを指定してください'
      }
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const summary = canvas.getByRole('alert')
    await expect(summary).toHaveTextContent('同じURLのブックマークが既に存在します')
    // Field 由来メッセージは summary 候補にも入るので、summary 側と field 側の両方に現れる
    await expect(summary).toHaveTextContent('別のURLを指定してください')
    await expect(canvas.getAllByText('別のURLを指定してください').length).toBeGreaterThanOrEqual(1)
  }
})

/**
 * Server field error の clear を、実際の親が持つ state から検証するための
 * 制御コンポーネント。BookmarkEditor と同じく「serverError を保持し、
 * onClearFieldError で該当 field だけ削る」責務を再現する。
 */
function ControlledBookmarkForm({
  initialServerError,
  onSubmit,
  ...forwarded
}: {
  readonly initialServerError: BookmarkFormServerError
} & Omit<BookmarkFormProps, 'serverError' | 'onClearFieldError'>) {
  const [serverError, setServerError] = useState<BookmarkFormServerError | null>(initialServerError)

  function handleClearFieldError(field: BookmarkFormFieldKey) {
    setServerError((current) => {
      if (current === null) {
        return current
      }
      const { fields } = current
      if (fields === undefined || fields[field] === undefined) {
        return current
      }
      const { [field]: _removed, ...remainingFields } = fields
      const nextFields = Object.keys(remainingFields).length === 0 ? undefined : remainingFields
      if (nextFields === undefined && current.summary === undefined) {
        return null
      }
      return {
        ...(current.summary === undefined ? {} : { summary: current.summary }),
        ...(nextFields === undefined ? {} : { fields: nextFields })
      }
    })
  }

  return (
    <BookmarkForm
      {...forwarded}
      serverError={serverError}
      onSubmit={onSubmit}
      onClearFieldError={handleClearFieldError}
    />
  )
}

export const ServerFieldErrorShownInFieldAndSummary = Default.extend({
  args: {
    initialValues: defaultInitialValues,
    onSubmit: fn<(values: BookmarkFormSubmitValues) => void>(),
    fetchTitleAction: defaultFetchTitleAction,
    serverError: {
      summary: '同じURLのブックマークが既に存在します',
      fields: { url: 'この URL は既に登録されています' }
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Summary に URL 由来メッセージが載る
    const summary = canvas.getByRole('alert')
    await expect(summary).toHaveTextContent('同じURLのブックマークが既に存在します')
    await expect(summary).toHaveTextContent('この URL は既に登録されています')
    // 同じメッセージが field 側にも表示される (summary と field の 2 か所)
    await expect(
      canvas.getAllByText('この URL は既に登録されています').length
    ).toBeGreaterThanOrEqual(2)
    // URL 入力が aria-invalid になっている
    await expect(canvas.getByLabelText('URL')).toHaveAttribute('aria-invalid', 'true')
  }
})

export const EditingClearsMatchingServerFieldError = Default.extend({
  render: (args) => (
    <ControlledBookmarkForm
      {...args}
      initialServerError={{
        summary: '入力内容を確認してください',
        fields: {
          url: 'この URL は既に登録されています',
          title: 'タイトルを入力してください'
        }
      }}
    />
  ),
  args: {
    initialValues: defaultInitialValues,
    onSubmit: fn<(values: BookmarkFormSubmitValues) => void>(),
    fetchTitleAction: defaultFetchTitleAction
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // 初期状態: URL と title 両方に server error (summary と field で 2 回ずつ)
    await expect(
      canvas.getAllByText('この URL は既に登録されています').length
    ).toBeGreaterThanOrEqual(1)
    await expect(canvas.getAllByText('タイトルを入力してください').length).toBeGreaterThanOrEqual(1)

    // URL を編集すると URL の server error が summary からも field からも消える (title は残る)
    const url = canvas.getByLabelText('URL')
    await userEvent.type(url, '?edited')
    await waitFor(() => {
      expect(canvas.queryByText('この URL は既に登録されています')).not.toBeInTheDocument()
    })
    await expect(canvas.getAllByText('タイトルを入力してください').length).toBeGreaterThanOrEqual(1)
  }
})

export const EditingOtherFieldKeepsUnrelatedServerError = Default.extend({
  render: (args) => (
    <ControlledBookmarkForm
      {...args}
      initialServerError={{
        fields: {
          url: 'この URL は既に登録されています'
        }
      }}
    />
  ),
  args: {
    initialValues: defaultInitialValues,
    onSubmit: fn<(values: BookmarkFormSubmitValues) => void>(),
    fetchTitleAction: defaultFetchTitleAction
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // 別 field (title) を編集しても、url の server error は残る
    const title = canvas.getByLabelText('タイトル')
    await userEvent.type(title, '!')
    await expect(
      canvas.getAllByText('この URL は既に登録されています').length
    ).toBeGreaterThanOrEqual(1)
  }
})

export const ValidationClearsOnEdit = Default.extend({
  args: {
    initialValues: {
      url: 'not-a-url',
      title: '   ',
      note: null
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // 送信で Conform validation error を出す
    await userEvent.click(canvas.getByRole('button', { name: '更新' }))
    await expect(canvas.getByText('有効なURLを入力してください')).toBeInTheDocument()

    // URL を編集すると Conform 側の error は onInput 再検証で消える
    const url = canvas.getByLabelText('URL')
    await userEvent.clear(url)
    await userEvent.type(url, 'https://example.com/edited')
    await waitFor(() => {
      expect(canvas.queryByText('有効なURLを入力してください')).not.toBeInTheDocument()
    })
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
    await expect(values?.tagIds).toEqual([])
  }
})

async function openTagPicker(canvas: ReturnType<typeof within>) {
  await userEvent.click(canvas.getByRole('button', { name: 'タグを選ぶ' }))
}

export const SelectsAndRemovesTags = Default.extend({
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const body = within(document.body)
    await openTagPicker(canvas)
    await userEvent.click(body.getByRole('option', { name: /TypeScript/ }))
    await expect(canvas.getByRole('button', { name: 'TypeScriptを外す' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    await expect(canvas.getByRole('button', { name: 'TypeScriptを外す' })).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: '更新' }))
    const onSubmit = args.onSubmit as Mock<(values: BookmarkFormSubmitValues) => void>
    await expect(onSubmit.mock.calls[0]?.[0]?.tagIds).toEqual([2])
    await userEvent.click(canvas.getByRole('button', { name: 'TypeScriptを外す' }))
    await expect(canvas.queryByRole('button', { name: 'TypeScriptを外す' })).not.toBeInTheDocument()
  }
})

export const SearchKeepsCandidateOrder = Default.extend({
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(document.body)
    await openTagPicker(canvas)
    const search = body.getByRole('searchbox', { name: 'タグを検索' })
    await userEvent.type(search, 't')
    const options = body.getAllByRole('option')
    await expect(options.map((option) => option.textContent)).toEqual([
      expect.stringContaining('React'),
      expect.stringContaining('TypeScript')
    ])
  }
})

export const CreateCtaWaitsUntilNamesAreReady = Default.extend({
  args: {
    tagsReady: false,
    tagCandidates: []
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(document.body)
    await openTagPicker(canvas)
    await userEvent.type(body.getByRole('searchbox', { name: 'タグを検索' }), 'Python')
    await expect(
      body.queryByRole('button', { name: /を新しいタグとして作成/ })
    ).not.toBeInTheDocument()
    await expect(body.getByRole('status')).toHaveTextContent('タグ候補を読み込み中です')
  }
})

export const CreatesAndSelectsNewTag = Default.extend({
  args: {
    createTagAction: fn<CreateTagFromPickerAction>(async (_previous, { name }) => ({
      status: 'created',
      tag: { id: 99, name: name.trim() }
    }))
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const body = within(document.body)
    await openTagPicker(canvas)
    await userEvent.type(body.getByRole('searchbox', { name: 'タグを検索' }), 'Python')
    await userEvent.click(body.getByRole('button', { name: '「Python」を新しいタグとして作成' }))
    await waitFor(() => {
      expect(canvas.getByRole('button', { name: 'Pythonを外す' })).toBeInTheDocument()
    })
    await userEvent.click(canvas.getByRole('button', { name: '更新' }))
    const onSubmit = args.onSubmit as Mock<(values: BookmarkFormSubmitValues) => void>
    await expect(onSubmit.mock.calls[0]?.[0]?.tagIds).toEqual([99])
  }
})

export const CreatePendingBlocksBookmarkSubmit = Default.extend({
  args: {
    createTagAction: fn<CreateTagFromPickerAction>(async () => {
      await new Promise(() => {})
      return { status: 'idle' }
    })
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(document.body)
    await openTagPicker(canvas)
    await userEvent.type(body.getByRole('searchbox', { name: 'タグを検索' }), 'Python')
    await userEvent.click(body.getByRole('button', { name: '「Python」を新しいタグとして作成' }))
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'タグを作成中です。完了するまで保存を開始できません。'
    )
    await expect(canvas.getByRole('button', { name: '更新' })).toBeDisabled()
    await userEvent.keyboard('{Escape}')
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'タグを作成中です。完了するまで保存を開始できません。'
    )
    await expect(canvas.getByRole('button', { name: '更新' })).toBeDisabled()
    await expect(canvas.getByLabelText('URL')).toBeEnabled()
  }
})

export const CreateFailureKeepsDraftAndShowsFieldError = Default.extend({
  args: {
    createTagAction: fn<CreateTagFromPickerAction>(async () => ({
      status: 'error',
      message: 'タグの作成に失敗しました'
    }))
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(document.body)
    await openTagPicker(canvas)
    await userEvent.click(body.getByRole('option', { name: /React/ }))
    await userEvent.type(body.getByRole('searchbox', { name: 'タグを検索' }), 'Python')
    await userEvent.click(body.getByRole('button', { name: '「Python」を新しいタグとして作成' }))
    await waitFor(() => {
      expect(canvas.getByRole('alert')).toHaveTextContent('タグの作成に失敗しました')
    })
    await userEvent.keyboard('{Escape}')
    await expect(canvas.getByRole('button', { name: 'Reactを外す' })).toBeInTheDocument()
    await expect(canvas.getByRole('alert')).toHaveTextContent('タグの作成に失敗しました')
  }
})

export const InvalidTagErrorStaysOnTagField = Default.extend({
  args: {
    serverError: {
      summary: '保存できないタグが含まれています。タグを選び直してください',
      fields: { tags: '保存できないタグが含まれています。タグを選び直してください' }
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toHaveTextContent('タグを選び直してください')
    await expect(canvas.getAllByText(/タグを選び直してください/).length).toBeGreaterThanOrEqual(2)
    await expect(canvas.getByLabelText('URL')).toHaveValue(defaultInitialValues.url)
  }
})

export const LongTagNameWrapsInsideForm = Default.extend({
  args: {
    initialValues: {
      ...defaultInitialValues,
      tagIds: [4]
    },
    tagCandidates: [
      ...defaultTagCandidates,
      {
        id: 4,
        name: 'あ'.repeat(32),
        pinned: false,
        sortOrder: 9
      }
    ]
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const chip = canvas.getByRole('button', { name: `${'あ'.repeat(32)}を外す` })
    await expect(chip).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: '更新' })).toBeVisible()
  }
})
