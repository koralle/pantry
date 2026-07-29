import { getInput, setInput } from '@formisch/react'
import type { FormStore } from '@formisch/react'
import { useState } from 'react'

import type { workbenchSchema } from '../components/bookmark-workbench-form'
import { fetchBookmarkTitle } from '../functions/fetch-bookmark-title'

export function useBookmarkTitleFetch(form: FormStore<typeof workbenchSchema>) {
  const [titleFetchError, setTitleFetchError] = useState<string | null>(null)
  const [isFetchingTitle, setIsFetchingTitle] = useState(false)

  async function handleFetchTitle() {
    setTitleFetchError(null)
    const url = getInput(form, { path: ['url'] }) ?? ''
    if (url.trim() === '') {
      setTitleFetchError('先にURLを入力してください')
      return
    }

    setIsFetchingTitle(true)
    try {
      const title = await fetchBookmarkTitle({ data: { url } })
      if (title == null) {
        setTitleFetchError('タイトルを取得できませんでした。手入力で続けられます')
        return
      }
      setInput(form, { path: ['title'], input: title })
    } catch (error) {
      setTitleFetchError(
        error instanceof Error
          ? error.message
          : 'タイトルを取得できませんでした。手入力で続けられます'
      )
    } finally {
      setIsFetchingTitle(false)
    }
  }

  return { titleFetchError, isFetchingTitle, handleFetchTitle }
}
