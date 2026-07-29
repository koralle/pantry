import { useState } from 'react'

import { readListLayout, writeListLayout } from '../lib/list-layout-preference'
import type { ListLayout } from '../lib/list-layout-preference'

export function useListLayout() {
  const [layout, setLayout] = useState<ListLayout>(() => readListLayout())

  const changeLayout = (next: ListLayout) => {
    setLayout(next)
    writeListLayout(next)
  }

  return [layout, changeLayout] as const
}
