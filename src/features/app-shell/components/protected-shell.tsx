import type { ReactNode } from 'react'
import { css } from 'styled-system/css'

const shell = css({
  display: 'grid',
  minBlockSize: '100dvh',
  gridTemplateColumns: '1fr',
  md: {
    gridTemplateColumns: '16rem minmax(0, 1fr)'
  }
})

const shellContent = css({
  display: 'flex',
  flexDirection: 'column',
  minBlockSize: '100dvh',
  minInlineSize: '0'
})

const shellMain = css({
  flex: '1',
  paddingBlockStart: '5',
  paddingInline: '4',
  paddingBlockEnd: '8',
  md: {
    paddingBlockStart: '6',
    paddingInline: '6',
    paddingBlockEnd: '10'
  }
})

export function ProtectedShell({
  sidebar,
  header,
  children
}: {
  readonly sidebar: ReactNode
  readonly header: ReactNode
  readonly children: ReactNode
}) {
  return (
    <div className={shell}>
      {sidebar}
      <div className={shellContent}>
        {header}
        <main className={shellMain}>{children}</main>
      </div>
    </div>
  )
}
