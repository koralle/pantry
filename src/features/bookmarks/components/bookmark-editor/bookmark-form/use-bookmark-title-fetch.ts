import { startTransition, useActionState, useRef, useState } from 'react'

import type {
  BookmarkFormFieldKey,
  BookmarkTitleFetchAction,
  BookmarkTitleFetchPayload,
  BookmarkTitleFetchState
} from './types'

const initialTitleFetchState: BookmarkTitleFetchState = { status: 'idle' }

// 空 URL の表示文言。文言は state に保存せず、表示時にこの定数から導出する。
const urlRequiredMessage = '先にURLを入力してください'

type UseBookmarkTitleFetchOptions = {
  readonly getUrl: () => string
  readonly setTitle: (title: string) => void
  readonly fetchTitleAction: BookmarkTitleFetchAction
  readonly onClearFieldError: ((field: BookmarkFormFieldKey) => void) | undefined
}

export function useBookmarkTitleFetch({
  getUrl,
  setTitle,
  fetchTitleAction,
  onClearFieldError
}: UseBookmarkTitleFetchOptions) {
  // 連打ガード用の in-flight ref。isPending はコミット前の同じレンダーでは false のままなので、
  // 同期チェックできる ref で race window を塞ぐ (閉包の isFetchingTitle では塞げない)。
  const inFlightRef = useRef(false)

  // 成功時の form 反映はこのラッパーが行う (fetchTitleAction は form に触れないため)。
  // ラッパーは毎レンダー再生成されるが、useActionState は最新レンダーの action を実行する。
  const applyFetchedTitleAction = async (
    previous: BookmarkTitleFetchState,
    payload: BookmarkTitleFetchPayload
  ): Promise<BookmarkTitleFetchState> => {
    try {
      const next = await fetchTitleAction(previous, payload)
      if (next.status === 'success') {
        setTitle(next.title)
        onClearFieldError?.('title')
        // 反映後に success を state に残す必要はないため idle へ正規化する。
        return { status: 'idle' }
      }
      return next
    } finally {
      // 例外 (reject / throw) でも必ず in-flight を解除する。
      inFlightRef.current = false
    }
  }

  const [titleFetchState, dispatch, isFetchingTitle] = useActionState(
    applyFetchedTitleAction,
    initialTitleFetchState
  )

  // 空 URL は dispatch 前に弾くため、表示するかどうかだけをフラグで持ち、
  // 文言は表示時に導出する (フラグ && 現在入力が空)。
  const [urlEmptyErrorShown, setUrlEmptyErrorShown] = useState(false)

  const urlEmptyError = urlEmptyErrorShown && getUrl().trim() === '' ? urlRequiredMessage : null

  const titleFetchError =
    urlEmptyError ??
    (titleFetchState.status === 'error' && !isFetchingTitle ? titleFetchState.message : null)

  function handleFetchTitle() {
    // 連打 (disabled がコミットされる前の同じレンダーの閉包) でも 2 回目の dispatch を防ぐ。
    if (inFlightRef.current) {
      return
    }
    const currentInputUrl = getUrl()
    if (currentInputUrl.trim() === '') {
      setUrlEmptyErrorShown(true)
      return
    }
    setUrlEmptyErrorShown(false)
    inFlightRef.current = true
    startTransition(() => {
      dispatch({ url: currentInputUrl })
    })
  }

  return { titleFetchError, isFetchingTitle, handleFetchTitle }
}
