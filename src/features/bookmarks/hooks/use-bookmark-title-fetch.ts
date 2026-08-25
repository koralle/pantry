import { useState } from 'react'

import { rpcClient } from '../../../rpc/client'
import { getTitleFetchErrorMessage } from '../lib/get-title-fetch-error-message'

const titleFetchFailedMessage = 'タイトルを取得できませんでした。手入力で続けられます'

type UseBookmarkTitleFetchOptions = {
  readonly getUrl: () => string
  readonly setTitle: (title: string) => void
}

export function useBookmarkTitleFetch({ getUrl, setTitle }: UseBookmarkTitleFetchOptions) {
  const [titleFetchError, setTitleFetchError] = useState<string | null>(null)
  const [isFetchingTitle, setIsFetchingTitle] = useState(false)

  async function handleFetchTitle() {
    setTitleFetchError(null)
    const url = getUrl()
    if (url.trim() === '') {
      setTitleFetchError('先にURLを入力してください')
      return
    }

    setIsFetchingTitle(true)
    try {
      const fetchedTitle = await rpcClient.bookmarks.title({ url })
      if (fetchedTitle == null) {
        setTitleFetchError(titleFetchFailedMessage)
        return
      }
      setTitle(fetchedTitle)
    } catch (error) {
      setTitleFetchError(getTitleFetchErrorMessage(error))
    } finally {
      setIsFetchingTitle(false)
    }
  }

  return { titleFetchError, isFetchingTitle, handleFetchTitle }
}
