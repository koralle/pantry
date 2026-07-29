import { css, cx } from 'styled-system/css'

import { dialogActions } from '../../../styles/dialog'
import { skeleton } from '../../../styles/feedback'
import { srOnly } from '../../../styles/sr-only'
import { workbenchNav } from '../../../styles/workbench'

const detailLayout = css({
  maxInlineSize: '42rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '6'
})
const detailHeader = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  paddingBlockStart: '2',
  paddingBlockEnd: '1'
})

const skeletonReset = css({ padding: '0', borderWidth: 'none' })
const skeletonBlockNote = cx(skeleton, skeletonReset, css({ minBlockSize: '5.5rem' }))
const skeletonBlockDates = cx(skeleton, skeletonReset, css({ minBlockSize: '4.5rem' }))
const skeletonLineNav = cx(skeleton, skeletonReset, css({ minBlockSize: '4', inlineSize: '22' }))
const skeletonLineTitle = cx(
  skeleton,
  skeletonReset,
  css({ minBlockSize: '8', inlineSize: 'min-22' })
)
const skeletonLineUrl = cx(
  skeleton,
  skeletonReset,
  css({ minBlockSize: '4', inlineSize: 'min-18' })
)
const skeletonLineTags = cx(
  skeleton,
  skeletonReset,
  css({ minBlockSize: '7', inlineSize: 'min-12' })
)
const skeletonLineAction = cx(
  skeleton,
  skeletonReset,
  css({ minBlockSize: '11', inlineSize: '22' })
)

export function BookmarkDetailSkeleton() {
  return (
    <div
      className={detailLayout}
      aria-busy='true'>
      <span className={srOnly}>詳細を読み込み中</span>
      <div className={workbenchNav}>
        <div
          className={skeletonLineNav}
          aria-hidden='true'
        />
      </div>
      <header className={detailHeader}>
        <div
          className={skeletonLineTitle}
          aria-hidden='true'
        />
        <div
          className={skeletonLineUrl}
          aria-hidden='true'
        />
      </header>
      <div
        className={skeletonBlockNote}
        aria-hidden='true'
      />
      <div
        className={skeletonLineTags}
        aria-hidden='true'
      />
      <div
        className={skeletonBlockDates}
        aria-hidden='true'
      />
      <div className={dialogActions}>
        <div
          className={skeletonLineAction}
          aria-hidden='true'
        />
        <div
          className={skeletonLineAction}
          aria-hidden='true'
        />
      </div>
    </div>
  )
}
