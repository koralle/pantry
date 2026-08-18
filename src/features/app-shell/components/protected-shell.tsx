import type { ReactNode } from 'react'
import { css } from 'styled-system/css'

const skipLink = css({
  position: 'absolute',
  insetInlineStart: '4',
  insetBlockStart: '4',
  zIndex: '10',
  paddingBlock: '2',
  paddingInline: '3',
  background: 'bg.surface',
  color: 'fg.default',
  borderWidth: 'thin',
  borderStyle: 'solid',
  borderColor: 'accent.solid',
  borderRadius: 'box',
  textDecoration: 'none',
  '&:not(:focus)': {
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    borderWidth: '0'
  }
})

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
      <a
        href='#content'
        className={skipLink}>
        本文へ
      </a>
      {sidebar}
      <div className={shellContent}>
        {header}
        <main
          id='content'
          tabIndex={-1}
          className={shellMain}>
          {children}
        </main>
      </div>
    </div>
  )
}
