import { ORPCError } from '@orpc/client'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowLeft, CircleDashed } from 'lucide-react'
import { ErrorBoundary } from 'react-error-boundary'

import { BookmarkEditor } from '../../../../features/bookmarks/components/bookmark-editor'
import type {
  BookmarkEditorData,
  BookmarkEditorSubmitResult,
  BookmarkTitleFetchAction
} from '../../../../features/bookmarks/components/bookmark-editor'
import { getTitleFetchErrorMessage } from '../../../../features/bookmarks/lib/get-title-fetch-error-message'
import { refreshAfterBookmarkMutation } from '../../../../features/bookmarks/lib/refresh-after-bookmark-mutation'
import { toUpdateBookmarkFailureCode } from '../../../../features/bookmarks/lib/update-bookmark-failure'
import { bookmarkDetailSearchSchema } from '../../../../features/navigation/lib/bookmark-search'
import { listSearchFromDetail } from '../../../../features/navigation/lib/bookmark-search-builders'
import { orpc } from '../../../../rpc/query'
import { getRpcClient } from '../../../../rpc/runtime-client'
import { createErrorFallback } from '../../../../shared/components/error-fallback'
import { StyledLink } from '../../../../shared/components/styled-link'
import { UiLoading } from '../../../../shared/components/ui-loading'
import {
  workbench,
  workbenchLead,
  workbenchNav,
  workbenchTitle
} from '../../../../styles/workbench'

const editorStaleTime = 5000

// タイトル取得失敗時のフォールバック文言 (null / 非 Error の throw で表示)
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

// 想定外エラー (action の reject など) の最終防衛線。想定内エラーは action の state 経由で表示される。
const EditError = createErrorFallback('編集画面の表示に失敗しました')

function isBookmarkNotFound(error: unknown): boolean {
  return error instanceof ORPCError && error.defined && error.code === 'bookmark-not-found'
}

/**
 * この Route は編集画面のページ境界であり、Storybook の Route Story 起点でもある。
 * params / search / loader / not-found / 画面固有リンク / navigation をここで閉じ、
 * Domain・DB・oRPC 実装詳細は注入された port の向こう側に置く。
 */
export const Route = createFileRoute('/_protected/bookmarks/$id/edit')({
  validateSearch: bookmarkDetailSearchSchema,
  loader: async ({ params, context }) => {
    const client = await getRpcClient()
    try {
      // Loader が cache を埋め、component は同じ query key を読む。
      // Server では request headers 付き direct client、browser では rpcClient が使われる。
      await context.queryClient.ensureQueryData(
        createTanstackQueryUtils(client).bookmarks.editor.queryOptions({
          input: { id: params.id },
          staleTime: editorStaleTime
        })
      )
    } catch (error: unknown) {
      if (isBookmarkNotFound(error)) {
        return { kind: 'not-found' as const }
      }
      throw error
    }

    return { kind: 'ok' as const }
  },
  component: RouteComponent
})

function RouteComponent() {
  const data = Route.useLoaderData()
  const search = Route.useSearch()
  const params = Route.useParams()
  const navigate = useNavigate()
  const router = useRouter()
  const queryClient = useQueryClient()
  const listSearch = listSearchFromDetail(search)
  const detailSearch = search

  const updateMutation = useMutation(orpc.bookmarks.update.mutationOptions())
  const editorQuery = useQuery(
    orpc.bookmarks.editor.queryOptions({ input: { id: params.id }, staleTime: editorStaleTime })
  )

  if (data.kind === 'not-found') {
    return (
      <section
        className={workbench}
        aria-label='ブックマーク編集'>
        <CircleDashed
          size={20}
          aria-hidden
        />

        <h1>このブックマークは見つかりません</h1>

        <StyledLink
          to='/'
          search={listSearch}
          visual='accent'>
          一覧へ戻る
        </StyledLink>
      </section>
    )
  }

  // Loader の ensureQueryData が成功しているため、cache は原則ここで埋まっている。
  if (!editorQuery.data) {
    return (
      <section
        className={workbench}
        aria-label='ブックマーク編集'>
        <UiLoading label='ブックマークを読み込み中' />
      </section>
    )
  }

  const record = editorQuery.data
  const initialData: BookmarkEditorData = {
    bookmarkId: record.id,
    url: record.url,
    title: record.title,
    note: record.note,
    tagIds: record.tagIds
  }

  return (
    <section
      className={workbench}
      aria-label='ブックマーク編集'>
      <nav className={workbenchNav}>
        <StyledLink
          to='/bookmarks/$id'
          params={{ id: initialData.bookmarkId }}
          search={detailSearch}
          visual='accent'>
          <ArrowLeft
            size={16}
            aria-hidden
          />{' '}
          詳細へ戻る
        </StyledLink>
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

      <h1 className={workbenchTitle}>ブックマークを編集</h1>
      <p className={workbenchLead}>内容を直し、主ボタンで保存します。</p>

      <ErrorBoundary FallbackComponent={EditError}>
        <BookmarkEditor
          key={initialData.bookmarkId}
          initialData={initialData}
          onUpdateBookmark={async (command): Promise<BookmarkEditorSubmitResult> => {
            try {
              const output = await updateMutation.mutateAsync({
                id: command.bookmarkId,
                url: command.url,
                title: command.title,
                note: command.note,
                tags: [...command.tagIds]
              })
              return { ok: true, bookmarkId: output.id }
            } catch (error: unknown) {
              return { ok: false, failureCode: toUpdateBookmarkFailureCode(error) }
            }
          }}
          fetchTitleAction={fetchTitleAction}
          onCompleted={async (bookmarkId) => {
            // DB commit 済みの成功を refresh failure で覆さない。invalidate は best-effort。
            refreshAfterBookmarkMutation(router, queryClient, 'UpdateBookmark')

            await navigate({
              to: '/bookmarks/$id',
              params: { id: bookmarkId },
              search: detailSearch,
              state: { bookmarkUpdated: true }
            })
          }}
        />
      </ErrorBoundary>
    </section>
  )
}
