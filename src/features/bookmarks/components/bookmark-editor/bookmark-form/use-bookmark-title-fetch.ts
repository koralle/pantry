import { getInput, setErrors, setInput } from '@formisch/react'
import { startTransition, useActionState, useEffect, useEffectEvent, useState } from 'react'

import type {
  BookmarkFormFieldKey,
  BookmarkFormStore,
  BookmarkTitleFetchAction,
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
  // 受け取った fetchTitleAction をそのまま useActionState に渡す。
  // この action は form store にアクセスできないため、空 URL 判定と
  // 成功結果の form store への反映はこの hook 側で行う。
  const [titleFetchState, dispatch, isFetchingTitle] = useActionState(
    fetchTitleAction,
    initialTitleFetchState
  )

  // 空 URL は dispatch 前に弾くため useActionState の state には載せられない。
  // そのような form-local なエラーは hook 側で保持し、表示時に action 由来のエラーより優先する。
  const [urlRequiredError, setUrlRequiredError] = useState<string | null>(null)

  // 成功 state (status: 'success') は action の戻り値としてしか得られないため、
  // 受け取ってから Formisch の title input へ反映する。
  // Formisch の field error と server error (onClearFieldError) も同時に clear する。
  // 依存配列には state の変化だけを載せ、親の再レンダーで title が上書きされないようにする。
  const applyFetchedTitle = useEffectEvent((title: string) => {
    setInput(form, { path: ['title'], input: title })
    clearFieldError(form, 'title')
    onClearFieldError?.('title')
  })

  useEffect(() => {
    if (titleFetchState.status !== 'success') {
      return
    }
    applyFetchedTitle(titleFetchState.title)
  }, [titleFetchState])

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
