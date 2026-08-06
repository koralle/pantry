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
  // 成功時の form 反映 (setInput / error clear) はこのラッパーが行う (fetchTitleAction は form store に触れないため)。
  // ラッパーは毎レンダー再生成されるが、useActionState は最新レンダーの action を実行する。
  const applyFetchedTitleAction = async (
    previous: BookmarkTitleFetchState,
    payload: BookmarkTitleFetchPayload
  ): Promise<BookmarkTitleFetchState> => {
    const next = await fetchTitleAction(previous, payload)
    if (next.status === 'success') {
      setInput(form, { path: ['title'], input: next.title })
      clearFieldError(form, 'title')
      onClearFieldError?.('title')
      // 反映後に success を state に残す必要はないため idle へ正規化する。
      return { status: 'idle' }
    }
    return next
  }

  const [titleFetchState, dispatch, isFetchingTitle] = useActionState(
    applyFetchedTitleAction,
    initialTitleFetchState
  )

  // 空 URL は dispatch 前に弾くため、表示するかどうかだけをフラグで持ち、
  // 文言は表示時に導出する (フラグ && 現在入力が空)。
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
