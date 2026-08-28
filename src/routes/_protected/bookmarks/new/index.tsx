import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'

import { BookmarkForm } from '../../../../features/bookmarks/components/bookmark-editor/bookmark-form'
import type {
  BookmarkFormServerError,
  BookmarkFormSubmitValues,
  BookmarkTitleFetchAction
} from '../../../../features/bookmarks/components/bookmark-editor/bookmark-form'
import { buildNewBookmarkCommand } from '../../../../features/bookmarks/components/new-bookmark-command'
import { getCreateBookmarkErrorMessage } from '../../../../features/bookmarks/lib/get-create-bookmark-error-message'
import { getTitleFetchErrorMessage } from '../../../../features/bookmarks/lib/get-title-fetch-error-message'
import { refreshAfterBookmarkMutation } from '../../../../features/bookmarks/lib/refresh-after-bookmark-mutation'
import { bookmarkDetailSearchSchema } from '../../../../features/navigation/lib/bookmark-search'
import { listSearchFromDetail } from '../../../../features/navigation/lib/bookmark-search-builders'
import { orpc } from '../../../../rpc/query'
import { getRpcClient } from '../../../../rpc/runtime-client'
import { StyledLink } from '../../../../shared/components/styled-link'
import {
  workbench,
  workbenchLead,
  workbenchNav,
  workbenchTitle
} from '../../../../styles/workbench'

const bookmarkTitleFetchFailedMessage = 'タイトルを取得できませんでした。手入力で続けられます'

/**
 * タイトル取得 action。BookmarkForm 側のラッパーを経て useActionState に渡り、
 * bookmarks.title procedure の null / throw を code 契約だけで表示用メッセージへ変換する。
 */
const fetchTitleAction: BookmarkTitleFetchAction = async (_previousState, { url }) => {
  try {
    const fetchedTitle = await (await getRpcClient()).bookmarks.title({ url })
    if (fetchedTitle === null) {
      return {
        status: 'error',
        message: bookmarkTitleFetchFailedMessage
      }
    }
    return { status: 'success', title: fetchedTitle }
  } catch (error: unknown) {
    return {
      status: 'error',
      message: getTitleFetchErrorMessage(error)
    }
  }
}

export const Route = createFileRoute('/_protected/bookmarks/new/')({
  validateSearch: bookmarkDetailSearchSchema,
  component: RouteComponent
})

function RouteComponent() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const router = useRouter()
  const queryClient = useQueryClient()
  const listSearch = listSearchFromDetail(search)
  const [serverError, setServerError] = useState<BookmarkFormServerError | null>(null)
  const mutation = useMutation(
    orpc.bookmarks.create.mutationOptions({
      onSuccess: () => {
        refreshAfterBookmarkMutation(router, queryClient, 'CreateBookmark')
      }
    })
  )

  async function handleSubmit(values: BookmarkFormSubmitValues) {
    setServerError(null)

    let id: string
    try {
      const created = await mutation.mutateAsync(
        buildNewBookmarkCommand({
          url: values.url,
          title: values.title,
          note: values.note
        })
      )
      id = created.id
    } catch (error: unknown) {
      const message = getCreateBookmarkErrorMessage(error)
      if (message !== null) {
        setServerError({ summary: message })
      }
      return
    }

    try {
      await navigate({
        to: '/bookmarks/$id',
        params: { id },
        search,
        state: { newBookmarkCreated: true }
      })
    } catch {
      setServerError({
        summary: '保存は完了しましたが、画面の移動に失敗しました'
      })
    }
  }

  return (
    <section
      className={workbench}
      aria-label='ブックマーク新規作成'>
      <nav className={workbenchNav}>
        <StyledLink
          to='/'
          search={listSearch}
          visual='accent'>
          <ArrowLeft
            size={16}
            aria-hidden
          />{' '}
          一覧へ戻る
        </StyledLink>
      </nav>

      <h1 className={workbenchTitle}>ブックマークを追加</h1>
      <p className={workbenchLead}>URLを入れて、必要ならタイトルを取得してから保存します。</p>

      <BookmarkForm
        initialValues={{ url: '', title: '', note: null }}
        serverError={serverError}
        submitLabel='登録'
        pendingLabel='登録中…'
        legend='ブックマーク新規登録'
        onSubmit={handleSubmit}
        fetchTitleAction={fetchTitleAction}
      />
    </section>
  )
}
