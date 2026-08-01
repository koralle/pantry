import { getInput, setErrors, setInput } from '@formisch/react'
import { startTransition, useActionState } from 'react'

import type { BookmarkFormFieldKey, BookmarkFormStore } from './types'

type TitleFetchState =
  | { readonly status: 'idle' }
  | { readonly status: 'error'; readonly message: string }

type TitleFetchAction = {
  readonly url: string
}

type UseBookmarkTitleFetchOptions = {
  readonly form: BookmarkFormStore
  readonly onFetchTitle: ((url: string) => Promise<string | null>) | undefined
}

export function useBookmarkTitleFetch({ form, onFetchTitle }: UseBookmarkTitleFetchOptions) {
  const [titleFetchState, dispatch, isFetchingTitle] = useActionState(
    async (_previous: TitleFetchState, action: TitleFetchAction): Promise<TitleFetchState> => {
      if (action.url.trim() === '') {
        return { status: 'error', message: '先にURLを入力してください' }
      }
      if (onFetchTitle === undefined) {
        return { status: 'idle' }
      }

      try {
        const fetchedTitle = await onFetchTitle(action.url)
        if (fetchedTitle === null) {
          return {
            status: 'error',
            message: 'タイトルを取得できませんでした。手入力で続けられます'
          }
        }

        setInput(form, { path: ['title'], input: fetchedTitle })
        clearFieldError(form, 'title')
        return { status: 'idle' }
      } catch (error: unknown) {
        return {
          status: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'タイトルを取得できませんでした。手入力で続けられます'
        }
      }
    },
    { status: 'idle' }
  )

  const titleFetchError =
    !isFetchingTitle && titleFetchState.status === 'error' ? titleFetchState.message : null

  function handleFetchTitle() {
    const currentInputUrl = getInput(form, { path: ['url'] }) ?? ''
    startTransition(() => {
      dispatch({ url: currentInputUrl })
    })
  }

  return { titleFetchError, isFetchingTitle, handleFetchTitle }
}

function clearFieldError(form: BookmarkFormStore, key: BookmarkFormFieldKey) {
  setErrors(form, { path: [key], errors: null })
}
