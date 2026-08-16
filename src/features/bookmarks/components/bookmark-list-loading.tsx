import { css } from 'styled-system/css'

import { UiLoading } from '../../../shared/components/ui-loading'
import type { ListLayout } from '../lib/list-layout-preference'
import { bookmarkCards } from './bookmark-card-list'

const tableSkeleton = css({ display: 'flex', flexDirection: 'column', gap: '2' })

export function ListLoading({ layout }: { readonly layout: ListLayout }) {
  if (layout === 'card') {
    return (
      <div
        className={bookmarkCards}
        aria-busy='true'>
        <UiLoading label='一覧を読み込み中' />
        <div aria-hidden='true'>
          <UiLoading label='一覧を読み込み中' />
        </div>
        <div aria-hidden='true'>
          <UiLoading label='一覧を読み込み中' />
        </div>
      </div>
    )
  }

  return (
    <div
      className={tableSkeleton}
      aria-busy='true'>
      <UiLoading label='一覧を読み込み中' />
      <div aria-hidden='true'>
        <UiLoading label='一覧を読み込み中' />
      </div>
      <div aria-hidden='true'>
        <UiLoading label='一覧を読み込み中' />
      </div>
    </div>
  )
}
