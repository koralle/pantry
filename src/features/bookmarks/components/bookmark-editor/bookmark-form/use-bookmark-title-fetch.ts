import { getInput, setErrors, setInput } from '@formisch/react'
import { startTransition, useActionState, useState } from 'react'

import type {
  BookmarkFormFieldKey,
  BookmarkFormStore,
  BookmarkTitleFetchAction,
  BookmarkTitleFetchPayload,
  BookmarkTitleFetchState
} from './types'

const initialTitleFetchState: BookmarkTitleFetchState = { status: 'idle' }

type UseBookmarkTitleFetchOptions = {
  readonly form: BookmarkFormStore
  readonly fetchTitleAction: BookmarkTitleFetchAction
  readonly onClearFieldError: ((field: BookmarkFormFieldKey) => void) | undefined
}

export function useBookmarkTitleFetch({
  form,
  fetchTitleAction,
  onClearFieldError
}: UseBookmarkTitleFetchOptions) {
  // 注入された fetchTitleAction は form store にアクセスできないため、この hook 側で
  // ラップし、success 時の form 反映 (setInput / error clear) を action 内で同期実行する。
  // 注入 action は純粋なまま、form 反映は BookmarkForm 側が所有する。
  // このラッパーは毎レンダー新しく生成されるが、useActionState が最新レンダーの action を
  // 実行するため、閉包 (form / onClearFieldError / fetchTitleAction) は最新になる。
  const applyFetchedTitleAction = async (
    previous: BookmarkTitleFetchState,
    payload: BookmarkTitleFetchPayload
  ): Promise<BookmarkTitleFetchState> => {
    const next = await fetchTitleAction(previous, payload)
    if (next.status === 'success') {
      setInput(form, { path: ['title'], input: next.title })
      clearFieldError(form, 'title')
      onClearFieldError?.('title')
    }
    return next
  }

  const [titleFetchState, dispatch, isFetchingTitle] = useActionState(
    applyFetchedTitleAction,
    initialTitleFetchState
  )

  // 空 URL は dispatch 前に弾くため useActionState の state には載せられない。
  // そのような form-local なエラーは hook 側で保持し、表示時に action 由来のエラーより優先する。
  const [urlRequiredError, setUrlRequiredError] = useState<string | null>(null)

  const titleFetchError =
    urlRequiredError ??
    (titleFetchState.status === 'error' && !isFetchingTitle ? titleFetchState.message : null)

  function handleFetchTitle() {
    const currentInputUrl = getInput(form, { path: ['url'] }) ?? ''
    if (currentInputUrl.trim() === '') {
      setUrlRequiredError('先にURLを入力してください')
      return
    }
    setUrlRequiredError(null)
    startTransition(() => {
      dispatch({ url: currentInputUrl })
    })
  }

  return { titleFetchError, isFetchingTitle, handleFetchTitle }
}

function clearFieldError(form: BookmarkFormStore, key: BookmarkFormFieldKey) {
  setErrors(form, { path: [key], errors: null })
}
