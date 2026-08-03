import type { ReactNode } from 'react'

import { tagField, tagFieldLegend } from './styles'

export function Frame({ children }: { readonly children: ReactNode }) {
  return (
    <fieldset
      className={tagField}
      aria-label='タグ'>
      <legend className={tagFieldLegend}>タグ</legend>
      {children}
    </fieldset>
  )
}
