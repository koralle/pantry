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

// 空 URL の表示文言。文言は state に保存せず、表示時にこの定数から導出する。
const urlRequiredMessage = '先にURLを入力してください'

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
  // 「表示するかどうか」だけをフラグで持ち、「なんと表示するか」は表示時に導出する。
  // 文言を state に持たないため、URL の入力変更だけでエラーが自動で消える
  // (フラグ && 現在入力が空、の導出表示の帰結)。
  // 一度フラグが立ったあとに再び空へ戻すとクリックなしで再表示されるが、仕様として許容する。
  const [urlEmptyErrorShown, setUrlEmptyErrorShown] = useState(false)

  const urlEmptyError =
    urlEmptyErrorShown && (getInput(form, { path: ['url'] }) ?? '').trim() === ''
      ? urlRequiredMessage
      : null

  const titleFetchError =
    urlEmptyError ??
    (titleFetchState.status === 'error' && !isFetchingTitle ? titleFetchState.message : null)

  function handleFetchTitle() {
    const currentInputUrl = getInput(form, { path: ['url'] }) ?? ''
    if (currentInputUrl.trim() === '') {
      setUrlEmptyErrorShown(true)
      return
    }
    setUrlEmptyErrorShown(false)
    startTransition(() => {
      dispatch({ url: currentInputUrl })
    })
  }

  return { titleFetchError, isFetchingTitle, handleFetchTitle }
}

function clearFieldError(form: BookmarkFormStore, key: BookmarkFormFieldKey) {
  setErrors(form, { path: [key], errors: null })
}
