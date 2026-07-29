/* oxlint-disable react/no-multi-comp */
// Catalog / Section / Meta はトークンカタログを描画するための一体のキットで、
// 分割すると Storybook 用の小さな断片が散らばるだけのため同居させている。
import type { ReactNode } from 'react'
import { css } from 'styled-system/css'
import { token } from 'styled-system/tokens'

import type { TokenEntry } from './token-data'

export function Catalog({
  title,
  description,
  children
}: {
  readonly title: string
  readonly description?: string
  readonly children: ReactNode
}) {
  return (
    <div className={catalogRoot}>
      <header className={catalogHeader}>
        <h1 className={catalogTitle}>{title}</h1>
        {description ? <p className={catalogDescription}>{description}</p> : null}
      </header>
      {children}
    </div>
  )
}

export function Section({
  title,
  children
}: {
  readonly title: string
  readonly children: ReactNode
}) {
  return (
    <section className={sectionRoot}>
      <h2 className={sectionTitle}>{title}</h2>
      {children}
    </section>
  )
}

export function Meta({ path, value }: { readonly path: string; readonly value: string }) {
  return (
    <dl className={metaRoot}>
      <div>
        <dt className={metaLabel}>token</dt>
        <dd className={metaValue}>{path}</dd>
      </div>
      <div>
        <dt className={metaLabel}>value</dt>
        <dd className={metaValue}>{value}</dd>
      </div>
    </dl>
  )
}

export function tokenValue(entry: TokenEntry): string {
  return token(entry.path) ?? '—'
}

const catalogRoot = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '8',
  color: 'fg.default',
  fontFamily: 'body',
  lineHeight: 'body'
})

const catalogHeader = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2'
})

const catalogTitle = css({
  margin: '0',
  fontSize: 'title',
  fontWeight: 'bold',
  lineHeight: 'tight'
})

const catalogDescription = css({
  margin: '0',
  color: 'fg.muted',
  fontSize: 'sm'
})

const sectionRoot = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4'
})

const sectionTitle = css({
  margin: '0',
  fontSize: 'lg',
  fontWeight: 'bold',
  lineHeight: 'tight'
})

const metaRoot = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
  margin: '0',
  fontSize: '2xs',
  color: 'fg.muted'
})

const metaLabel = css({
  display: 'inline',
  fontWeight: 'semibold',
  marginInlineEnd: '1.5',
  '&::after': { content: '":"' }
})

const metaValue = css({
  display: 'inline',
  margin: '0',
  fontFamily: 'mono',
  overflowWrap: 'anywhere'
})
