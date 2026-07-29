import { use } from 'react'

import type { ShelfTag } from '../lib/tag-shelf'
import { EntranceBoxesIdeal } from './entrance-boxes-ideal'

export function EntranceBoxesAsync({
  shelfTagsPromise
}: {
  readonly shelfTagsPromise: Promise<ShelfTag[]>
}) {
  const tags = use(shelfTagsPromise)
  return <EntranceBoxesIdeal tags={tags} />
}
