import { useEffect } from 'react'

import type { BookmarkSearchSchema } from '../../navigation/lib/bookmark-search'
import { touchTagLastUsed } from '../functions/touch-tag-last-used'
import type { ShelfTag } from '../lib/tag-shelf'

export function useTouchTagLastUsedOnce(
  search: BookmarkSearchSchema,
  shelfTagsPromise: Promise<ShelfTag[]>
) {
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
      const primary = tags.find((tag) => tag.name === primaryName)
      if (primary != null) {
        void touchTagLastUsed({ data: { id: primary.id } })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [tagKey, shelfTagsPromise])
}
