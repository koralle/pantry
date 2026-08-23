import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, CircleDashed } from 'lucide-react'
import { ErrorBoundary } from 'react-error-boundary'
import * as v from 'valibot'

import { BookmarkEditor } from '../../../../features/bookmarks/components/bookmark-editor'
import type { BookmarkTitleFetchAction } from '../../../../features/bookmarks/components/bookmark-editor'
import { loadBookmarkForEdit } from '../../../../features/bookmarks/functions/load-bookmark-for-edit'
import { updateBookmark } from '../../../../features/bookmarks/functions/update-bookmark'
import { getTitleFetchErrorMessage } from '../../../../features/bookmarks/lib/get-title-fetch-error-message'
import { buildListBackSearch } from '../../../../features/navigation/lib/bookmark-search-builders'
import { rpcClient } from '../../../../rpc/client'
import { createErrorFallback } from '../../../../shared/components/error-fallback'
import { StyledLink } from '../../../../shared/components/styled-link'
import { err } from '../../../../shared/domain/result'
import {
  workbench,
  workbenchLead,
  workbenchNav,
  workbenchTitle
} from '../../../../styles/workbench'

const bookmarkEditSearchSchema = v.object({
  tags: v.optional(v.array(v.string()))
})

// タイトル取得失敗時のフォールバック文言 (null / 非 Error の throw で表示)
const bookmarkTitleFetchFailedMessage = 'タイトルを取得できませんでした。手入力で続けられます'

/**
 * タイトル取得 action。BookmarkForm 側のラッパーを経て useActionState に渡り、
 * bookmarks.title procedure の null / throw を code 契約だけで表示用メッセージへ変換する。
 */
const fetchTitleAction: BookmarkTitleFetchAction = async (_previousState, { url }) => {
  try {
    const fetchedTitle = await rpcClient.bookmarks.title({ url })
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

/**
 * RouteComponent は編集画面の Screen 境界であり、Storybook の Route Story 起点でもある。
 * params / search / loader / not-found / 画面固有リンク / navigation をここで閉じ、
 * Domain・DB・Server Function 実装詳細は注入された port の向こう側に置く。
 */
export const Route = createFileRoute('/_protected/bookmarks/$id/edit')({
  validateSearch: bookmarkEditSearchSchema,
  loader: async ({ params }) => {
    const bookmarkResult = await loadBookmarkForEdit({ data: { id: params.id } })

    if (!bookmarkResult.ok) {
      return { kind: 'not-found' as const }
    }

    return {
      kind: 'ok' as const,
      initialData: bookmarkResult.value
    }
  },
  component: RouteComponent
})

function RouteComponent() {
  const data = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate()
  const listSearch = buildListBackSearch(search?.tags)

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

  const { initialData } = data
  const detailSearch = search?.tags !== undefined ? { tags: search.tags } : {}

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
          onUpdateBookmark={async (command) => {
            try {
              return await updateBookmark({
                data: {
                  id: command.bookmarkId,
                  url: command.url,
                  title: command.title,
                  note: command.note,
                  tags: [...command.tagIds]
                }
              })
            } catch {
              return err({ code: 'unexpected-error' })
            }
          }}
          fetchTitleAction={fetchTitleAction}
          onCompleted={async (bookmarkId) => {
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
