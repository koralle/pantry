import { use } from 'react'

import type { ShelfTag } from '../lib/tag-shelf'
import { ShelfNav } from './shelf-nav'
import type { ShelfNavSelection } from './shelf-nav'

type ShelfNavAsyncProps = {
  readonly shelfTagsPromise: Promise<ShelfTag[]>
  readonly selection: ShelfNavSelection
  readonly onNavigate?: (() => void) | undefined
}

export function ShelfNavAsync({ shelfTagsPromise, selection, onNavigate }: ShelfNavAsyncProps) {
  const tags = use(shelfTagsPromise)
  return (
    <ShelfNav
      tags={tags}
      selection={selection}
      onNavigate={onNavigate}
    />
  )
}
