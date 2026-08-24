import { getInput, setInput } from '@formisch/react'
import type { FormStore } from '@formisch/react'
import { useState } from 'react'

import { rpcClient } from '../../../rpc/client'
import type { workbenchSchema } from '../components/bookmark-workbench-form'
import { getTitleFetchErrorMessage } from '../lib/get-title-fetch-error-message'

const titleFetchFailedMessage = 'タイトルを取得できませんでした。手入力で続けられます'

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
      const fetchedTitle = await rpcClient.bookmarks.title({ url })
      if (fetchedTitle == null) {
        setTitleFetchError(titleFetchFailedMessage)
        return
      }
      setInput(form, { path: ['title'], input: fetchedTitle })
    } catch (error) {
      setTitleFetchError(getTitleFetchErrorMessage(error))
    } finally {
      setIsFetchingTitle(false)
    }
  }

  return { titleFetchError, isFetchingTitle, handleFetchTitle }
}
