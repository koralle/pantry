import { useMutation } from '@tanstack/react-query'
import { useEffect } from 'react'

import { orpc } from '../../../rpc/query'
import type { BookmarkSearchSchema } from '../../navigation/lib/bookmark-search'
import { tagNamesMatch } from '../domain/tag-values'
import type { ShelfTag } from '../lib/tag-shelf'

/**
 * Fire-and-forget。失敗は mutation state に落ちるだけにし、
 * session expiry の redirect は共通 interceptor に任せる。
 */
export function useTouchTagLastUsedOnce(
  search: BookmarkSearchSchema,
  shelfTagsPromise: Promise<ShelfTag[]>
) {
  const { mutate: touchTag } = useMutation(orpc.tags.touch.mutationOptions())
  const tagKey = search.tags?.join('\0') ?? ''

  useEffect(() => {
    if (tagKey === '') {
      return
    }

    let cancelled = false

    void (async () => {
      const tags = await shelfTagsPromise
      if (cancelled) {
        return
      }
      const primaryName = tagKey.split('\0')[0]
      if (primaryName === undefined || primaryName === '') {
        return
      }
      const primary = tags.find((tag) => tagNamesMatch(tag.name, primaryName))
      if (primary != null) {
        touchTag({ id: primary.id })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [tagKey, shelfTagsPromise, touchTag])
}
